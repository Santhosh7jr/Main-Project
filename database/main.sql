-- Active: 1777627290817@@127.0.0.1@5432@medguard_db
-- ============================================================
-- MEDGUARD DATABASE
-- ============================================================

-- Run this once manually if the database does not exist:
-- CREATE DATABASE medguard_db;

-- Connect to medguard_db before running the rest of this file.


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ============================================================
-- DOCTORS
-- ============================================================

CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    specialization VARCHAR(150),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- PATIENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,

    doctor_id INTEGER NOT NULL
        REFERENCES doctors(id)
        ON DELETE CASCADE,

    name VARCHAR(150) NOT NULL,

    age INTEGER NOT NULL
        CHECK (age >= 0 AND age <= 150),

    gender VARCHAR(20) NOT NULL
        CHECK (gender IN ('Male', 'Female', 'Other')),

    phone VARCHAR(20),

    email VARCHAR(150),

    blood_group VARCHAR(10),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- PATIENT CONDITIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS patient_conditions (
    id SERIAL PRIMARY KEY,

    patient_id INTEGER NOT NULL
        REFERENCES patients(id)
        ON DELETE CASCADE,

    condition_name VARCHAR(200) NOT NULL
);


-- ============================================================
-- PATIENT ALLERGIES
-- ============================================================

CREATE TABLE IF NOT EXISTS patient_allergies (
    id SERIAL PRIMARY KEY,

    patient_id INTEGER NOT NULL
        REFERENCES patients(id)
        ON DELETE CASCADE,

    allergy_name VARCHAR(200) NOT NULL
);


-- ============================================================
-- MEDICINES
-- ============================================================

CREATE TABLE IF NOT EXISTS medicines (
    id SERIAL PRIMARY KEY,

    name VARCHAR(200) NOT NULL,

    generic_name VARCHAR(200),

    therapeutic_class VARCHAR(200),

    action_class VARCHAR(200),

    chemical_class VARCHAR(200),

    habit_forming BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- MEDICINE USES
-- ============================================================

CREATE TABLE IF NOT EXISTS medicine_uses (
    id SERIAL PRIMARY KEY,

    medicine_id INTEGER NOT NULL
        REFERENCES medicines(id)
        ON DELETE CASCADE,

    use_name VARCHAR(300) NOT NULL
);


-- ============================================================
-- DOCUMENTED SIDE EFFECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS medicine_side_effects (
    id SERIAL PRIMARY KEY,

    medicine_id INTEGER NOT NULL
        REFERENCES medicines(id)
        ON DELETE CASCADE,

    side_effect_name VARCHAR(300) NOT NULL
);


-- ============================================================
-- PATIENT MEDICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS patient_medications (
    id SERIAL PRIMARY KEY,

    patient_id INTEGER NOT NULL
        REFERENCES patients(id)
        ON DELETE CASCADE,

    medicine_id INTEGER NOT NULL
        REFERENCES medicines(id),

    dosage VARCHAR(100),

    frequency VARCHAR(100),

    start_date DATE,

    end_date DATE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- ADR ASSESSMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,

    doctor_id INTEGER NOT NULL
        REFERENCES doctors(id)
        ON DELETE CASCADE,

    patient_id INTEGER NOT NULL
        REFERENCES patients(id)
        ON DELETE CASCADE,

    medicine_id INTEGER NOT NULL
        REFERENCES medicines(id),

    risk_level VARCHAR(20),

    confidence DECIMAL(7,6),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- PREDICTED ADRs
-- ============================================================

CREATE TABLE IF NOT EXISTS assessment_adrs (
    id SERIAL PRIMARY KEY,

    assessment_id INTEGER NOT NULL
        REFERENCES assessments(id)
        ON DELETE CASCADE,

    adr_name VARCHAR(300) NOT NULL,

    probability DECIMAL(7,6),

    score DECIMAL(12,8)
);


-- ============================================================
-- ASSESSMENT ALTERNATIVES
-- ============================================================

CREATE TABLE IF NOT EXISTS assessment_alternatives (
    id SERIAL PRIMARY KEY,

    assessment_id INTEGER NOT NULL
        REFERENCES assessments(id)
        ON DELETE CASCADE,

    medicine_id INTEGER NOT NULL
        REFERENCES medicines(id),

    similarity DECIMAL(7,6),

    reason TEXT
);


-- ============================================================
-- INDEXES
-- ============================================================

-- Doctors

CREATE INDEX IF NOT EXISTS idx_doctors_email
ON doctors(email);


-- Patients

CREATE INDEX IF NOT EXISTS idx_patients_doctor_id
ON patients(doctor_id);

CREATE INDEX IF NOT EXISTS idx_patients_name
ON patients(name);


-- Patient conditions

CREATE INDEX IF NOT EXISTS idx_patient_conditions_patient_id
ON patient_conditions(patient_id);


-- Patient allergies

CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient_id
ON patient_allergies(patient_id);


-- Patient medications

CREATE INDEX IF NOT EXISTS idx_patient_medications_patient_id
ON patient_medications(patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_medications_medicine_id
ON patient_medications(medicine_id);


-- Medicines

CREATE INDEX IF NOT EXISTS idx_medicines_name_trgm
ON medicines
USING gin (LOWER(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_medicines_generic_name_trgm
ON medicines
USING gin (LOWER(generic_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_medicines_therapeutic_class
ON medicines(therapeutic_class);

CREATE INDEX IF NOT EXISTS idx_medicines_action_class
ON medicines(action_class);

CREATE INDEX IF NOT EXISTS idx_medicines_chemical_class
ON medicines(chemical_class);


-- Medicine relationships

CREATE INDEX IF NOT EXISTS idx_medicine_uses_medicine_id
ON medicine_uses(medicine_id);

CREATE INDEX IF NOT EXISTS idx_medicine_side_effects_medicine_id
ON medicine_side_effects(medicine_id);


-- Assessments

CREATE INDEX IF NOT EXISTS idx_assessments_doctor_id
ON assessments(doctor_id);

CREATE INDEX IF NOT EXISTS idx_assessments_patient_id
ON assessments(patient_id);

CREATE INDEX IF NOT EXISTS idx_assessments_medicine_id
ON assessments(medicine_id);

CREATE INDEX IF NOT EXISTS idx_assessments_created_at
ON assessments(created_at DESC);


-- Assessment ADRs

CREATE INDEX IF NOT EXISTS idx_assessment_adrs_assessment_id
ON assessment_adrs(assessment_id);


-- Assessment alternatives

CREATE INDEX IF NOT EXISTS idx_assessment_alternatives_assessment_id
ON assessment_alternatives(assessment_id);

CREATE INDEX IF NOT EXISTS idx_assessment_alternatives_medicine_id
ON assessment_alternatives(medicine_id);


SELECT column_name
FROM information_schema.columns
WHERE table_name = 'assessments'
ORDER BY ordinal_position;


SELECT column_name
FROM information_schema.columns
WHERE table_name = 'assessment_adrs'
ORDER BY ordinal_position;

SELECT id, doctor_id, name
FROM patients;

SELECT *
FROM assessments
ORDER BY id DESC
LIMIT 5;

SELECT *
FROM assessment_adrs
ORDER BY id DESC
LIMIT 10;

SELECT
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'medicine_uses'
ORDER BY ordinal_position;

ALTER TABLE medicine_uses
ALTER COLUMN use_name TYPE TEXT;

SELECT
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'medicine_uses'
ORDER BY ordinal_position;

