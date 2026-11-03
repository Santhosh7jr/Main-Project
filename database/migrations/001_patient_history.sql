-- Add structured patient history while preserving existing patient and assessment rows.

ALTER TABLE patient_conditions
  ADD COLUMN IF NOT EXISTS diagnosis_date DATE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'current',
  ADD COLUMN IF NOT EXISTS clinical_notes TEXT;

ALTER TABLE patient_allergies
  ADD COLUMN IF NOT EXISTS reaction TEXT,
  ADD COLUMN IF NOT EXISTS severity VARCHAR(20) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) NOT NULL DEFAULT 'unverified';

ALTER TABLE patient_medications
  ADD COLUMN IF NOT EXISTS treatment_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS treatment_duration VARCHAR(100),
  ADD COLUMN IF NOT EXISTS discontinuation_date DATE,
  ADD COLUMN IF NOT EXISTS discontinuation_reason TEXT,
  ADD COLUMN IF NOT EXISTS adverse_reaction BOOLEAN;

UPDATE patient_medications
SET treatment_status = CASE
  WHEN end_date IS NOT NULL AND end_date < CURRENT_DATE THEN 'discontinued'
  ELSE 'current'
END
WHERE treatment_status IS NULL;

ALTER TABLE patient_medications
  ALTER COLUMN treatment_status SET DEFAULT 'current',
  ALTER COLUMN treatment_status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'patient_conditions_status_check'
      AND conrelid = 'patient_conditions'::regclass
  ) THEN
    ALTER TABLE patient_conditions
      ADD CONSTRAINT patient_conditions_status_check
      CHECK (status IN ('current', 'resolved', 'unknown'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'patient_allergies_severity_check'
      AND conrelid = 'patient_allergies'::regclass
  ) THEN
    ALTER TABLE patient_allergies
      ADD CONSTRAINT patient_allergies_severity_check
      CHECK (severity IN ('mild', 'moderate', 'severe', 'unknown'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'patient_allergies_verification_check'
      AND conrelid = 'patient_allergies'::regclass
  ) THEN
    ALTER TABLE patient_allergies
      ADD CONSTRAINT patient_allergies_verification_check
      CHECK (verification_status IN ('unverified', 'patient_reported', 'clinician_verified'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'patient_medications_treatment_status_check'
      AND conrelid = 'patient_medications'::regclass
  ) THEN
    ALTER TABLE patient_medications
      ADD CONSTRAINT patient_medications_treatment_status_check
      CHECK (treatment_status IN ('current', 'completed', 'discontinued', 'unknown'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS patient_adverse_reactions (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
  suspected_medicine VARCHAR(200) NOT NULL,
  reaction TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'unknown'
    CHECK (severity IN ('mild', 'moderate', 'severe', 'unknown')),
  started_at DATE,
  duration VARCHAR(100),
  medication_stopped BOOLEAN,
  symptoms_resolved_after_stopping BOOLEAN,
  symptoms_returned_after_restarting BOOLEAN,
  treatment_received TEXT,
  outcome TEXT,
  clinical_notes TEXT,
  reporter_type VARCHAR(30) NOT NULL DEFAULT 'patient_reported'
    CHECK (reporter_type IN ('patient_reported', 'caregiver_reported', 'clinician_reported')),
  verification_status VARCHAR(30) NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'patient_reported', 'clinician_verified')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patient_measurements (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  measurement_name VARCHAR(100) NOT NULL,
  value NUMERIC(12, 4),
  value_text VARCHAR(200),
  unit VARCHAR(40),
  systolic_value NUMERIC(7, 2),
  diastolic_value NUMERIC(7, 2),
  measured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  clinical_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    value IS NOT NULL OR value_text IS NOT NULL
    OR systolic_value IS NOT NULL OR diastolic_value IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS patient_clinical_notes (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS patient_medications_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS patient_reactions_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS patient_measurements_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS patient_context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS patient_safety_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS current_complaints JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS newly_reported_reactions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS doctor_decision VARCHAR(30),
  ADD COLUMN IF NOT EXISTS doctor_notes TEXT,
  ADD COLUMN IF NOT EXISTS actual_outcome TEXT,
  ADD COLUMN IF NOT EXISTS actual_outcome_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS patient_complaints (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assessment_id INTEGER REFERENCES assessments(id) ON DELETE SET NULL,
  complaint TEXT NOT NULL,
  reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'resolved', 'unknown')),
  clinical_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE assessment_alternatives
  ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) NOT NULL DEFAULT 'suggested',
  ADD COLUMN IF NOT EXISTS patient_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS previous_reaction_matches JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS doctor_decision VARCHAR(20),
  ADD COLUMN IF NOT EXISTS decision_notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assessment_alternatives_review_status_check'
      AND conrelid = 'assessment_alternatives'::regclass
  ) THEN
    ALTER TABLE assessment_alternatives
      ADD CONSTRAINT assessment_alternatives_review_status_check
      CHECK (review_status IN ('suggested', 'reviewed', 'selected', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assessment_alternatives_doctor_decision_check'
      AND conrelid = 'assessment_alternatives'::regclass
  ) THEN
    ALTER TABLE assessment_alternatives
      ADD CONSTRAINT assessment_alternatives_doctor_decision_check
      CHECK (doctor_decision IS NULL OR doctor_decision IN ('selected', 'rejected', 'deferred'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assessments_doctor_decision_check'
      AND conrelid = 'assessments'::regclass
  ) THEN
    ALTER TABLE assessments
      ADD CONSTRAINT assessments_doctor_decision_check
      CHECK (doctor_decision IS NULL OR doctor_decision IN ('prescribed', 'not_prescribed', 'deferred'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_patient_adverse_reactions_patient_date
  ON patient_adverse_reactions(patient_id, started_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_adverse_reactions_medicine
  ON patient_adverse_reactions(medicine_id);
CREATE INDEX IF NOT EXISTS idx_patient_measurements_patient_date
  ON patient_measurements(patient_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_clinical_notes_patient_date
  ON patient_clinical_notes(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_complaints_patient_date
  ON patient_complaints(patient_id, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_actual_outcome
  ON assessments(patient_id, actual_outcome_at DESC)
  WHERE actual_outcome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_alternatives_review_status
  ON assessment_alternatives(assessment_id, review_status);
