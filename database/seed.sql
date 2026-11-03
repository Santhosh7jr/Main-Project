-- Repeatable development seed data for medguard_db.
-- Demo account: medguard.demo@example.com
-- Its one-time password is provided after setup; change it after first login.

BEGIN;

INSERT INTO doctors (name, email, password_hash, specialization)
VALUES (
    'MedGuard Demo Doctor',
    'medguard.demo@example.com',
    '$2b$12$LOLwrc.nZgxZXINdb/9J6emiQCKiQ3/SoHou8hfDzKQ.eFMHDFqf.',
    'General Medicine'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO patients
    (doctor_id, name, age, gender, phone, email, blood_group)
SELECT
    d.id,
    sample.name,
    sample.age,
    sample.gender,
    sample.phone,
    sample.email,
    sample.blood_group
FROM doctors AS d
CROSS JOIN (
    VALUES
        ('Rahul Sharma', 45, 'Male', '+91 98765 43210', 'rahul.sharma@example.com', 'B+'),
        ('Priya Nair', 32, 'Female', '+91 98765 12345', 'priya.nair@example.com', 'O+'),
        ('Arjun Kumar', 58, 'Male', '+91 99887 77665', 'arjun.kumar@example.com', 'A+'),
        ('Sneha Reddy', 27, 'Female', '+91 91234 56789', 'sneha.reddy@example.com', 'AB+')
) AS sample(name, age, gender, phone, email, blood_group)
WHERE d.email = 'medguard.demo@example.com'
  AND NOT EXISTS (
      SELECT 1 FROM patients AS p WHERE p.email = sample.email
  );

INSERT INTO patient_conditions (patient_id, condition_name)
SELECT p.id, sample.condition_name
FROM patients AS p
JOIN (
    VALUES
        ('rahul.sharma@example.com', 'Hypertension'),
        ('rahul.sharma@example.com', 'Type 2 Diabetes'),
        ('priya.nair@example.com', 'Asthma'),
        ('arjun.kumar@example.com', 'Hypertension'),
        ('arjun.kumar@example.com', 'High Cholesterol')
) AS sample(email, condition_name) ON sample.email = p.email
WHERE NOT EXISTS (
    SELECT 1
    FROM patient_conditions AS pc
    WHERE pc.patient_id = p.id
      AND pc.condition_name = sample.condition_name
);

INSERT INTO patient_allergies (patient_id, allergy_name)
SELECT p.id, sample.allergy_name
FROM patients AS p
JOIN (
    VALUES
        ('rahul.sharma@example.com', 'Penicillin'),
        ('priya.nair@example.com', 'Aspirin'),
        ('sneha.reddy@example.com', 'Ibuprofen')
) AS sample(email, allergy_name) ON sample.email = p.email
WHERE NOT EXISTS (
    SELECT 1
    FROM patient_allergies AS pa
    WHERE pa.patient_id = p.id
      AND pa.allergy_name = sample.allergy_name
);

INSERT INTO medicines
    (name, generic_name, therapeutic_class, action_class, chemical_class, habit_forming)
SELECT
    sample.name,
    sample.generic_name,
    sample.therapeutic_class,
    sample.action_class,
    sample.chemical_class,
    FALSE
FROM (
    VALUES
        ('Paracetamol', 'Acetaminophen', 'Analgesic / Antipyretic', 'COX Inhibitor', 'Para-aminophenol derivative'),
        ('Amoxicillin', 'Amoxicillin', 'Antibiotic', 'Penicillin Antibiotic', 'Beta-lactam'),
        ('Ibuprofen', 'Ibuprofen', 'NSAID', 'COX Inhibitor', 'Propionic acid derivative'),
        ('Azithromycin', 'Azithromycin', 'Antibiotic', 'Macrolide', 'Macrolide')
) AS sample(name, generic_name, therapeutic_class, action_class, chemical_class)
WHERE NOT EXISTS (
    SELECT 1
    FROM medicines AS m
    WHERE LOWER(TRIM(m.name)) = LOWER(TRIM(sample.name))
);

INSERT INTO medicine_uses (medicine_id, use_name)
SELECT m.id, sample.use_name
FROM (
    VALUES
        ('Paracetamol', 'Fever'),
        ('Paracetamol', 'Headache'),
        ('Paracetamol', 'Pain'),
        ('Paracetamol', 'Body pain'),
        ('Amoxicillin', 'Bacterial infections'),
        ('Amoxicillin', 'Respiratory infections'),
        ('Amoxicillin', 'Ear infections'),
        ('Ibuprofen', 'Pain'),
        ('Ibuprofen', 'Inflammation'),
        ('Ibuprofen', 'Fever'),
        ('Azithromycin', 'Bacterial infections'),
        ('Azithromycin', 'Respiratory infections')
) AS sample(medicine_name, use_name)
JOIN medicines AS m ON LOWER(TRIM(m.name)) = LOWER(TRIM(sample.medicine_name))
WHERE NOT EXISTS (
    SELECT 1
    FROM medicine_uses AS mu
    WHERE mu.medicine_id = m.id
      AND LOWER(TRIM(mu.use_name)) = LOWER(TRIM(sample.use_name))
);

INSERT INTO medicine_side_effects (medicine_id, side_effect_name)
SELECT m.id, sample.side_effect_name
FROM (
    VALUES
        ('Paracetamol', 'Nausea'),
        ('Paracetamol', 'Headache'),
        ('Paracetamol', 'Dizziness'),
        ('Paracetamol', 'Abdominal discomfort'),
        ('Amoxicillin', 'Nausea'),
        ('Amoxicillin', 'Diarrhea'),
        ('Amoxicillin', 'Skin rash'),
        ('Amoxicillin', 'Vomiting'),
        ('Ibuprofen', 'Nausea'),
        ('Ibuprofen', 'Stomach pain'),
        ('Ibuprofen', 'Dizziness'),
        ('Ibuprofen', 'Headache'),
        ('Azithromycin', 'Nausea'),
        ('Azithromycin', 'Diarrhea'),
        ('Azithromycin', 'Abdominal discomfort')
) AS sample(medicine_name, side_effect_name)
JOIN medicines AS m ON LOWER(TRIM(m.name)) = LOWER(TRIM(sample.medicine_name))
WHERE NOT EXISTS (
    SELECT 1
    FROM medicine_side_effects AS mse
    WHERE mse.medicine_id = m.id
      AND LOWER(TRIM(mse.side_effect_name)) = LOWER(TRIM(sample.side_effect_name))
);

INSERT INTO patient_medications
    (patient_id, medicine_id, dosage, frequency, start_date)
SELECT p.id, m.id, sample.dosage, sample.frequency, sample.start_date::date
FROM (
    VALUES
        ('rahul.sharma@example.com', 'Paracetamol', '500 mg', 'Twice daily', '2026-08-01'),
        ('priya.nair@example.com', 'Azithromycin', '500 mg', 'Once daily', '2026-08-05'),
        ('arjun.kumar@example.com', 'Paracetamol', '500 mg', 'As needed', '2026-08-10')
) AS sample(patient_email, medicine_name, dosage, frequency, start_date)
JOIN patients AS p ON p.email = sample.patient_email
JOIN medicines AS m ON LOWER(TRIM(m.name)) = LOWER(TRIM(sample.medicine_name))
WHERE NOT EXISTS (
    SELECT 1
    FROM patient_medications AS pm
    WHERE pm.patient_id = p.id
      AND pm.medicine_id = m.id
      AND pm.start_date = sample.start_date::date
);

COMMIT;
