import unittest

from services.patient_safety import (
    analyze_patient_safety,
    check_allergies,
    check_previous_reactions,
)


class PatientSafetyTest(unittest.TestCase):
    def test_allergy_match_requires_exact_normalized_name(self):
        medicine = {
            "name": "Amoxicillin 500 mg",
            "genericName": "Amoxicillin",
            "chemicalClass": "Penicillin",
        }

        self.assertEqual(
            len(check_allergies({"allergies": ["amoxicillin"]}, medicine)),
            1,
        )
        self.assertEqual(
            check_allergies({"allergies": ["pen"]}, medicine),
            [],
        )

    def test_previous_reaction_match_is_reported_with_verification(self):
        alerts = check_previous_reactions(
            {
                "adverseReactions": [
                    {
                        "suspectedMedicine": "Aspirin",
                        "reaction": "Rash",
                        "severity": "moderate",
                        "verificationStatus": "clinician_verified",
                    },
                ],
            },
            {"name": "Aspirin 75 mg", "genericName": "Aspirin"},
        )

        self.assertEqual(len(alerts), 1)
        self.assertIn("clinician-verified", alerts[0]["message"])

    def test_unavailable_checks_and_missing_history_are_explicit(self):
        result = analyze_patient_safety(
            {
                "age": 40,
                "gender": "Other",
                "conditions": [],
                "allergies": [],
                "medications": [],
                "adverseReactions": [],
                "measurements": [],
            },
            {"name": "Example medicine"},
        )

        self.assertEqual(result["checkAvailability"]["drugInteractions"], "unavailable")
        self.assertIn("No allergy records are documented.", result["missingInformation"])


if __name__ == "__main__":
    unittest.main()
