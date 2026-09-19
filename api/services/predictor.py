from pathlib import Path
import joblib


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "model" / "adr_model.joblib"


class ADRPredictor:

    def __init__(self):
        print(
            f"Loading ADR model from: {MODEL_PATH}"
        )

        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"ADR model not found at: {MODEL_PATH}"
            )

        self.artifact = joblib.load(MODEL_PATH)

        if not isinstance(self.artifact, dict):
            raise ValueError(
                "Invalid ADR model artifact. "
                "Expected a dictionary."
            )

        print("ADR model loaded successfully.")

        self.vectorizer = (
            self.artifact.get("vectorizer")
        )

        self.classifier = (
            self.artifact.get("classifier")
        )

        self.classes = (
            self.artifact.get("classes")
        )

        self.threshold = float(
            self.artifact.get(
                "threshold",
                0.30
            )
        )

        self.model_type = (
            self.artifact.get(
                "model_type",
                "Unknown"
            )
        )

        if self.vectorizer is None:
            raise ValueError(
                "Vectorizer not found in "
                "adr_model.joblib"
            )

        if self.classifier is None:
            raise ValueError(
                "Classifier not found in "
                "adr_model.joblib"
            )

        if self.classes is None:
            raise ValueError(
                "ADR classes not found in "
                "adr_model.joblib"
            )

        print(
            f"Model type: {self.model_type}"
        )

        print(
            f"ADR classes: {len(self.classes)}"
        )

        print(
            f"Threshold: {self.threshold}"
        )


    def build_medicine_text(self, medicine):
        """
        Build the feature text EXACTLY as it was constructed
        during model training.

        Training representation:
            name
            use0 ... use4
            Therapeutic Class
            Action Class
            Chemical Class
            Habit Forming

        IMPORTANT:
        Side effects are intentionally excluded because they
        are the prediction targets and including them would
        cause target leakage.
        """

        parts = []

        # --------------------------------------------------
        # 1. Medicine name
        # --------------------------------------------------

        name = medicine.get("name", "")

        if name is not None:
            name = str(name).strip().lower()

            if name:
                parts.append(name)

        # --------------------------------------------------
        # 2. Medical uses
        # --------------------------------------------------

        uses = medicine.get("uses", [])

        if not isinstance(uses, list):
            uses = [uses] if uses else []

        for use in uses[:5]:

            if use is None:
                continue

            value = str(use).strip().lower()

            if value:
                parts.append(value)

        # --------------------------------------------------
        # 3. Pharmacological / chemical metadata
        # --------------------------------------------------

        metadata_fields = [
            "therapeuticClass",
            "actionClass",
            "chemicalClass",
            "habitForming",
        ]

        for field in metadata_fields:

            value = medicine.get(field, "")

            if value is None:
                continue

            value = str(value).strip().lower()

            if value:
                parts.append(value)

        # --------------------------------------------------
        # Final feature text
        # --------------------------------------------------

        return " ".join(parts)


    def predict(self, medicine):

        medicine_text = (
            self.build_medicine_text(
                medicine
            )
        )

        print(
            "\n================================"
        )

        print(
            "Prediction input:"
        )

        print(
            medicine_text
        )

        print(
            "================================"
        )

        # ---------------------------------------------
        # Transform input
        # ---------------------------------------------

        features = (
            self.vectorizer.transform(
                [medicine_text]
            )
        )

        print(
            "Feature shape:",
            features.shape
        )

        # ---------------------------------------------
        # Get classifier scores
        # ---------------------------------------------

        scores = (
            self.classifier
            .decision_function(
                features
            )
        )

        if len(scores.shape) == 1:
            scores = scores.reshape(
                1,
                -1
            )

        sample_scores = scores[0]

        # ---------------------------------------------
        # Sort scores
        # ---------------------------------------------

        ranked_indices = sorted(
            range(
                len(sample_scores)
            ),
            key=lambda index:
                sample_scores[index],
            reverse=True
        )

        # ---------------------------------------------
        # TOP 10 DEBUG SCORES
        # ---------------------------------------------

        top_scores = []

        for index in ranked_indices[:10]:

            top_scores.append({
                "adr": str(
                    self.classes[index]
                ),
                "score": float(
                    sample_scores[index]
                )
            })

        print(
            "\nTOP 10 MODEL SCORES:"
        )

        for item in top_scores:

            print(
                f"{item['adr']} "
                f"-> "
                f"{item['score']:.6f}"
            )

        print(
            "\nThreshold:",
            self.threshold
        )

        # ---------------------------------------------
        # Apply trained threshold
        # ---------------------------------------------

        predicted_adrs = []

        for index in ranked_indices:

            score = sample_scores[index]

            if score >= self.threshold:

                predicted_adrs.append({
                    "adr": str(
                        self.classes[index]
                    ),
                    "score": float(score)
                })

        print(
            "\nPredictions above threshold:",
            len(predicted_adrs)
        )

        print(
            "================================\n"
        )

        return {
            "medicineText": medicine_text,

            "predictedADRs":
                predicted_adrs,

            "threshold":
                self.threshold,

            # Diagnostic information.
            # We will remove this after debugging.
            "topScores":
                top_scores
        }


predictor = ADRPredictor()