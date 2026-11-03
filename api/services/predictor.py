"""Runtime adapter for the trained multi-label ADR model."""
from pathlib import Path

import joblib

from services.feature_builder import build_medicine_text

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "model" / "adr_model.joblib"


class ModelUnavailableError(RuntimeError):
    """Raised when the model artifact cannot serve predictions."""


class ADRPredictor:
    def __init__(self, model_path=MODEL_PATH):
        self.model_path = Path(model_path)
        self.artifact = None

    def _load(self):
        if self.artifact is not None:
            return
        if not self.model_path.is_file():
            raise ModelUnavailableError(
                "ADR model is unavailable. Train the model before requesting predictions."
            )
        try:
            artifact = joblib.load(self.model_path)
            if not isinstance(artifact, dict):
                raise ValueError("Expected a dictionary model artifact.")
            if any(artifact.get(key) is None for key in ("vectorizer", "classifier", "classes")):
                raise ValueError("Required model components are missing.")
            if len(artifact["classes"]) == 0:
                raise ValueError("The model contains no ADR labels.")
            threshold = float(artifact["threshold"])
            if not (-10 <= threshold <= 10):
                raise ValueError("The model threshold is invalid.")
        except Exception as error:
            print(f"Unable to load ADR model artifact: {error}", flush=True)
            raise ModelUnavailableError(
                "ADR model is unavailable because its saved artifact is missing or incompatible."
            ) from error

        self.artifact = artifact
        print(
            f"ADR model loaded: {self.model_path}; "
            f"type={self.model_type}; labels={len(self.classes)}; threshold={self.threshold:.3f}",
            flush=True,
        )

    @property
    def vectorizer(self):
        self._load()
        return self.artifact["vectorizer"]

    @property
    def classifier(self):
        self._load()
        return self.artifact["classifier"]

    @property
    def classes(self):
        self._load()
        return self.artifact["classes"]

    @property
    def threshold(self):
        self._load()
        return float(self.artifact["threshold"])

    @property
    def model_type(self):
        self._load()
        return self.artifact.get("model_type", "Unknown")

    @property
    def metadata(self):
        self._load()
        return self.artifact.get(
            "training_metadata",
            self.artifact.get("metadata", {}),
        )

    def model_info(self):
        return {
            "modelReady": True,
            "modelType": self.model_type,
            "threshold": self.threshold,
            "numberOfClasses": len(self.classes),
            "scoreType": "model_score",
            "scoreMeaning": "Linear SVM decision score; not a probability or patient-specific clinical risk estimate.",
            "patientPersonalized": False,
            "trainingMetadata": self.metadata,
        }

    def predict(self, medicine):
        medicine_text = build_medicine_text(medicine)
        features = self.vectorizer.transform([medicine_text])
        scores = self.classifier.decision_function(features)
        if getattr(scores, "ndim", 1) == 1:
            scores = scores.reshape(1, -1)
        sample_scores = scores[0]
        ranked_indices = sorted(
            range(len(sample_scores)),
            key=lambda index: float(sample_scores[index]),
            reverse=True,
        )

        predicted_adrs = [
            {"adr": str(self.classes[index]), "score": float(sample_scores[index])}
            for index in ranked_indices
            if float(sample_scores[index]) >= self.threshold
        ]
        top_scores = [
            {"adr": str(self.classes[index]), "score": float(sample_scores[index])}
            for index in ranked_indices[:10]
        ]

        return {
            "medicineText": medicine_text,
            "source": "machine_learning_model",
            "predictedADRs": predicted_adrs,
            "threshold": self.threshold,
            "scoreType": "model_score",
            "scoreMeaning": "Linear SVM decision score; not a probability, severity, or patient-specific risk estimate.",
            "topScores": top_scores,
            "modelType": self.model_type,
            "patientPersonalized": False,
            "trainingMetadata": self.metadata,
        }


predictor = ADRPredictor()
