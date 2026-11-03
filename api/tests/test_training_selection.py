import unittest

import pandas as pd

from train_model import REQUIRED_COLUMNS, select_training_rows


def make_record(record_id, name, missing=None, side_effect="headache"):
    record = {column: "" for column in REQUIRED_COLUMNS}
    record.update({
        "name": name,
        "use0": "pain",
        "Therapeutic Class": "analgesic",
        "Action Class": "pain relief",
        "Chemical Class": "salicylate",
        "Habit Forming": "No",
        "sideEffect0": side_effect,
        "record_id": record_id,
    })
    if missing:
        record[missing] = ""
    return record


class TrainingSelectionTests(unittest.TestCase):
    def test_selects_complete_unique_medicines_with_valid_targets(self):
        frame = pd.DataFrame([
            make_record(1, "Aspirin", missing="Chemical Class"),
            make_record(2, " aspirin "),
            make_record(3, "medicine beta", side_effect="nausea"),
            make_record(4, "medicine gamma", side_effect="dizziness"),
            make_record(5, "medicine without target", side_effect=""),
            make_record(6, "   ", side_effect="rash"),
        ])

        selected, summary = select_training_rows(frame, max_rows=3, seed=42)
        repeated, _ = select_training_rows(frame, max_rows=3, seed=42)

        self.assertEqual(set(selected["record_id"]), {2, 3, 4})
        self.assertEqual(selected["record_id"].tolist(), repeated["record_id"].tolist())
        self.assertEqual(summary["source_dataset_rows"], 6)
        self.assertEqual(summary["eligible_source_rows"], 4)
        self.assertEqual(summary["eligible_medicine_name_groups"], 3)
        self.assertEqual(summary["selected_records"], 3)
        self.assertIn(
            "one row per normalized medicine name",
            summary["selection_strategy"],
        )


if __name__ == "__main__":
    unittest.main()
