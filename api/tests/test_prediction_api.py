import unittest
import tempfile
from pathlib import Path
from unittest.mock import patch

from app import app
from services.predictor import ADRPredictor


class ADRPredictionAPITests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_model_info_reports_ready_medicine_feature_model(self):
        response = self.client.get("/api/model-info")
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertTrue(body["modelReady"])
        self.assertFalse(body["patientPersonalized"])
        self.assertGreater(body["numberOfClasses"], 0)

    def test_api_starts_and_reports_missing_model_without_exposing_paths(self):
        with tempfile.TemporaryDirectory() as directory:
            missing_model = ADRPredictor(Path(directory) / "missing.joblib")
            with patch("routes.prediction.predictor", missing_model):
                info = self.client.get("/api/model-info")
                health = self.client.get("/api/health")
        self.assertEqual(info.status_code, 503)
        self.assertFalse(info.get_json()["modelReady"])
        self.assertNotIn(directory, info.get_data(as_text=True))
        self.assertEqual(health.status_code, 200)

    def test_prediction_returns_model_scores_not_probabilities(self):
        response = self.client.post(
            "/api/predict",
            json={
                "medicine": {
                    "name": "sample medicine",
                    "uses": ["headache"],
                    "therapeuticClass": "analgesic",
                    "actionClass": "pain relief",
                    "chemicalClass": None,
                    "habitForming": False,
                }
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["source"], "machine_learning_model")
        self.assertEqual(data["scoreType"], "model_score")
        self.assertFalse(data["patientPersonalized"])
        self.assertIsInstance(data["predictedADRs"], list)
        for item in data["predictedADRs"]:
            self.assertIsInstance(item["adr"], str)
            self.assertIsInstance(item["score"], (int, float))

    def test_patient_fields_do_not_change_medicine_only_prediction(self):
        medicine = {"name": "sample medicine", "uses": ["headache"]}
        with_patient = self.client.post(
            "/api/predict",
            json={
                "medicine": medicine,
                "patient": {"age": 80, "allergies": ["sample medicine"]},
            },
        )
        without_patient = self.client.post(
            "/api/predict",
            json={"medicine": medicine},
        )
        self.assertEqual(with_patient.status_code, 200)
        self.assertEqual(without_patient.status_code, 200)
        self.assertEqual(
            with_patient.get_json()["data"]["predictedADRs"],
            without_patient.get_json()["data"]["predictedADRs"],
        )

    def test_invalid_medicine_input_is_rejected(self):
        response = self.client.post("/api/predict", json={"medicine": {"name": "  "}})
        self.assertEqual(response.status_code, 400)
        self.assertIn("medicine name", response.get_json()["message"].lower())


if __name__ == "__main__":
    unittest.main()
