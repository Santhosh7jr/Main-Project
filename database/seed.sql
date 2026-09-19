-- ============================================
-- MEDGUARD SAMPLE DATA
-- ============================================


-- ============================================
-- PATIENTS
-- ============================================

INSERT INTO patients
(name, age, gender, phone, email, blood_group)
VALUES
(
    'Rahul Sharma',
    45,
    'Male',
    '+91 98765 43210',
    'rahul.sharma@example.com',
    'B+'
),
(
    'Priya Nair',
    32,
    'Female',
    '+91 98765 12345',
    'priya.nair@example.com',
    'O+'
),
(
    'Arjun Kumar',
    58,
    'Male',
    '+91 99887 77665',
    'arjun.kumar@example.com',
    'A+'
),
(
    'Sneha Reddy',
    27,
    'Female',
    '+91 91234 56789',
    'sneha.reddy@example.com',
    'AB+'
);


-- ============================================
-- CONDITIONS
-- ============================================

INSERT INTO patient_conditions
(patient_id, condition_name)
VALUES
(1, 'Hypertension'),
(1, 'Type 2 Diabetes'),

(2, 'Asthma'),

(3, 'Hypertension'),
(3, 'High Cholesterol');


-- ============================================
-- ALLERGIES
-- ============================================

INSERT INTO patient_allergies
(patient_id, allergy_name)
VALUES
(1, 'Penicillin'),
(2, 'Aspirin'),
(4, 'Ibuprofen');


-- ============================================
-- MEDICINES
-- ============================================

INSERT INTO medicines
(
    name,
    generic_name,
    therapeutic_class,
    action_class,
    chemical_class,
    habit_forming
)
VALUES
(
    'Paracetamol',
    'Acetaminophen',
    'Analgesic / Antipyretic',
    'COX Inhibitor',
    'Para-aminophenol derivative',
    FALSE
),

(
    'Amoxicillin',
    'Amoxicillin',
    'Antibiotic',
    'Penicillin Antibiotic',
    'Beta-lactam',
    FALSE
),

(
    'Ibuprofen',
    'Ibuprofen',
    'NSAID',
    'COX Inhibitor',
    'Propionic acid derivative',
    FALSE
),

(
    'Azithromycin',
    'Azithromycin',
    'Antibiotic',
    'Macrolide',
    'Macrolide',
    FALSE
);


-- ============================================
-- MEDICINE USES
-- ============================================

INSERT INTO medicine_uses
(medicine_id, use_name)
VALUES

(1, 'Fever'),
(1, 'Headache'),
(1, 'Pain'),
(1, 'Body pain'),

(2, 'Bacterial infections'),
(2, 'Respiratory infections'),
(2, 'Ear infections'),

(3, 'Pain'),
(3, 'Inflammation'),
(3, 'Fever'),

(4, 'Bacterial infections'),
(4, 'Respiratory infections');


-- ============================================
-- DOCUMENTED SIDE EFFECTS
-- ============================================

INSERT INTO medicine_side_effects
(medicine_id, side_effect_name)
VALUES

(1, 'Nausea'),
(1, 'Headache'),
(1, 'Dizziness'),
(1, 'Abdominal discomfort'),

(2, 'Nausea'),
(2, 'Diarrhea'),
(2, 'Skin rash'),
(2, 'Vomiting'),

(3, 'Nausea'),
(3, 'Stomach pain'),
(3, 'Dizziness'),
(3, 'Headache'),

(4, 'Nausea'),
(4, 'Diarrhea'),
(4, 'Abdominal discomfort');


-- ============================================
-- PATIENT MEDICATIONS
-- ============================================

INSERT INTO patient_medications
(
    patient_id,
    medicine_id,
    dosage,
    frequency,
    start_date
)
VALUES

(1, 1, '500 mg', 'Twice daily', '2026-08-01'),

(2, 4, '500 mg', 'Once daily', '2026-08-05'),

(3, 1, '500 mg', 'As needed', '2026-08-10');