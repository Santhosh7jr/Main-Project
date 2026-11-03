ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS patient_medication_id INTEGER
    REFERENCES patient_medications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS assessments_patient_medication_id_idx
  ON assessments(patient_medication_id);
