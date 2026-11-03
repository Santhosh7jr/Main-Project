import pool from "../config/database.js";

import type {
  CreatePatientRequest,
  PatientAdverseReactionInput,
  PatientAllergyInput,
  PatientConditionInput,
  PatientMeasurementInput,
  PatientMedicationInput,
  UpdatePatientRequest,
} from "../types/patient.js";


// ======================================================
// GET ALL PATIENTS FOR A DOCTOR
// ======================================================

export const getAllPatients = async (
  doctorId: number,
) => {
  const result = await pool.query(
    `
    SELECT
      p.id,
      p.name,
      p.age,
      p.gender,
      p.phone,
      p.email,
      p.blood_group AS "bloodGroup",
      p.created_at AS "createdAt",

      COALESCE((
        SELECT ARRAY_AGG(pc.condition_name ORDER BY pc.id)
        FROM patient_conditions pc
        WHERE pc.patient_id = p.id AND pc.status = 'current'
      ), '{}') AS conditions,
      COALESCE((
        SELECT ARRAY_AGG(pa.allergy_name ORDER BY pa.id)
        FROM patient_allergies pa
        WHERE pa.patient_id = p.id
      ), '{}') AS allergies,
      COALESCE((
        SELECT JSON_AGG(JSON_BUILD_OBJECT(
          'id', pm.id,
          'medicineId', pm.medicine_id,
          'medicineName', m.name,
          'dosage', pm.dosage,
          'frequency', pm.frequency,
          'startDate', pm.start_date,
          'endDate', pm.end_date,
          'treatmentStatus', pm.treatment_status,
          'treatmentDuration', pm.treatment_duration,
          'discontinuationDate', pm.discontinuation_date,
          'discontinuationReason', pm.discontinuation_reason,
          'adverseReaction', pm.adverse_reaction
        ) ORDER BY pm.created_at DESC)
        FROM patient_medications pm
        JOIN medicines m ON m.id = pm.medicine_id
        WHERE pm.patient_id = p.id AND pm.treatment_status = 'current'
      ), '[]'::json) AS medications,
      (
        SELECT COUNT(*)::int
        FROM patient_medications pm
        WHERE pm.patient_id = p.id AND pm.treatment_status = 'current'
      ) AS "activeMedicationCount",
      (
        SELECT COUNT(*)::int
        FROM patient_conditions pc
        WHERE pc.patient_id = p.id AND pc.status = 'current'
      ) AS "conditionCount",
      (
        SELECT MAX(a.created_at)
        FROM assessments a
        WHERE a.patient_id = p.id
      ) AS "latestAssessmentAt",

      '[]'::json AS "assessmentHistory"

    FROM patients p

    WHERE p.doctor_id = $1

    ORDER BY p.created_at DESC
    `,
    [doctorId],
  );

  return result.rows;
};


// ======================================================
// GET PATIENT BY ID
// ONLY IF PATIENT BELONGS TO DOCTOR
// ======================================================

export const getPatientById = async (
  patientId: number,
  doctorId: number,
) => {
  const patientResult = await pool.query(
    `
    SELECT
      id,
      name,
      age,
      gender,
      phone,
      email,
      blood_group AS "bloodGroup",
      created_at AS "createdAt"
    FROM patients
    WHERE id = $1
      AND doctor_id = $2
    `,
    [
      patientId,
      doctorId,
    ],
  );

  if (patientResult.rows.length === 0) {
    return null;
  }

  const patient = patientResult.rows[0];

  // --------------------------------------------------
  // Conditions
  // --------------------------------------------------

  const conditionsResult =
    await pool.query(
      `
      SELECT id, condition_name AS "conditionName",
        diagnosis_date AS "diagnosisDate", status,
        clinical_notes AS "clinicalNotes"
      FROM patient_conditions
      WHERE patient_id = $1
      ORDER BY id
      `,
      [patientId],
    );

  // --------------------------------------------------
  // Allergies
  // --------------------------------------------------

  const allergiesResult =
    await pool.query(
      `
      SELECT id, allergy_name AS "allergyName", reaction,
        severity, verification_status AS "verificationStatus"
      FROM patient_allergies
      WHERE patient_id = $1
      ORDER BY id
      `,
      [patientId],
    );

  // --------------------------------------------------
  // Current medications
  // --------------------------------------------------

  const medicationsResult =
    await pool.query(
      `
      SELECT
        pm.id,
        pm.medicine_id AS "medicineId",
        m.name AS "medicineName",
        pm.dosage,
        pm.frequency,
        pm.start_date AS "startDate",
        pm.end_date AS "endDate",
        pm.treatment_status AS "treatmentStatus",
        pm.treatment_duration AS "treatmentDuration",
        pm.discontinuation_date AS "discontinuationDate",
        pm.discontinuation_reason AS "discontinuationReason",
        pm.adverse_reaction AS "adverseReaction"

      FROM patient_medications pm

      JOIN medicines m
        ON pm.medicine_id = m.id

      WHERE pm.patient_id = $1

      ORDER BY pm.created_at DESC
      `,
      [patientId],
    );

  const reactionsResult = await pool.query(
    `
    SELECT
      id,
      medicine_id AS "medicineId",
      suspected_medicine AS "suspectedMedicine",
      reaction,
      severity,
      started_at AS "startedAt",
      duration,
      medication_stopped AS "medicationStopped",
      symptoms_resolved_after_stopping AS "symptomsResolvedAfterStopping",
      symptoms_returned_after_restarting AS "symptomsReturnedAfterRestarting",
      treatment_received AS "treatmentReceived",
      outcome,
      clinical_notes AS "clinicalNotes",
      reporter_type AS "reporterType",
      verification_status AS "verificationStatus",
      created_at AS "createdAt"
    FROM patient_adverse_reactions
    WHERE patient_id = $1
    ORDER BY COALESCE(started_at, created_at::date) DESC, id DESC
    `,
    [patientId],
  );

  const measurementsResult = await pool.query(
    `
    SELECT
      id,
      measurement_name AS "measurementName",
      value::float AS value,
      value_text AS "valueText",
      unit,
      systolic_value::float AS "systolicValue",
      diastolic_value::float AS "diastolicValue",
      measured_at AS "measuredAt",
      clinical_notes AS "clinicalNotes"
    FROM patient_measurements
    WHERE patient_id = $1
    ORDER BY measured_at DESC, id DESC
    `,
    [patientId],
  );

  const complaintsResult = await pool.query(
    `
    SELECT id, complaint, reported_at AS "reportedAt", status,
      clinical_notes AS "clinicalNotes"
    FROM patient_complaints
    WHERE patient_id = $1
    ORDER BY reported_at DESC, id DESC
    `,
    [patientId],
  );

  const notesResult = await pool.query(
    `
    SELECT id, note, created_at AS "createdAt"
    FROM patient_clinical_notes
    WHERE patient_id = $1
    ORDER BY created_at DESC, id DESC
    `,
    [patientId],
  );

  // --------------------------------------------------
  // Finalized ADR assessment history
  // --------------------------------------------------
  //
  // IMPORTANT:
  // Only finalized assessments are returned here.
  // Preview runs never reach this table.
  // --------------------------------------------------

  const assessmentHistoryResult =
    await pool.query(
      `
      SELECT
        a.id,
        a.created_at AS "createdAt",

        COALESCE(
          a.patient_name_snapshot,
          p.name
        ) AS "patientName",

        COALESCE(
          a.patient_age_snapshot,
          p.age
        )::int AS "patientAge",

        COALESCE(
          a.patient_gender_snapshot,
          p.gender
        ) AS "patientGender",

        COALESCE(
          a.patient_conditions_snapshot,
          '[]'::jsonb
        ) AS "patientConditions",

        COALESCE(
          a.patient_allergies_snapshot,
          '[]'::jsonb
        ) AS "patientAllergies",

        a.medicine_id AS "medicineId",
        m.name AS "medicineName",
        m.generic_name AS "genericName",
        m.therapeutic_class AS "therapeuticClass",
        m.action_class AS "actionClass",
        m.chemical_class AS "chemicalClass",
        m.habit_forming AS "habitForming",

        COALESCE(a.risk_level, 'Unavailable') AS "riskLevel",
        a.confidence::float AS confidence,
        a.doctor_decision AS "doctorDecision",
        a.actual_outcome AS "actualOutcome",
        COALESCE(a.current_complaints, '[]'::jsonb) AS "currentComplaints",
        COALESCE(a.newly_reported_reactions, '[]'::jsonb) AS "newlyReportedReactions",
        COALESCE(a.patient_context_snapshot, '{}'::jsonb) AS "patientContextSnapshot",
        COALESCE(a.patient_safety_snapshot, '{}'::jsonb) AS "patientSafetySnapshot",

        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'adr', aa.adr_name,
              'score', aa.score::float,
              'probability', aa.probability::float
            )
            ORDER BY aa.score DESC NULLS LAST
          ) FILTER (WHERE aa.id IS NOT NULL),
          '[]'::json
        ) AS predictions

      FROM assessments a

      JOIN patients p
        ON p.id = a.patient_id

      JOIN medicines m
        ON m.id = a.medicine_id

      LEFT JOIN assessment_adrs aa
        ON aa.assessment_id = a.id

      WHERE a.patient_id = $1

      GROUP BY
        a.id,
        p.id,
        p.name,
        p.age,
        p.gender,
        m.id,
        m.name,
        m.generic_name,
        m.therapeutic_class,
        m.action_class,
        m.chemical_class,
        m.habit_forming

      ORDER BY a.created_at DESC
      `,
      [patientId],
    );

  return {
    ...patient,

    conditions:
      conditionsResult.rows
        .filter((row) => row.status === "current")
        .map((row) => row.conditionName),

    allergies:
      allergiesResult.rows.map((row) => row.allergyName),

    conditionRecords: conditionsResult.rows,
    allergyDetails: allergiesResult.rows,

    medications:
      medicationsResult.rows,

    previousMedications: medicationsResult.rows.filter(
      (row) => row.treatmentStatus !== "current",
    ),
    adverseReactions: reactionsResult.rows,
    measurements: measurementsResult.rows,
    complaints: complaintsResult.rows,
    clinicalNotes: notesResult.rows,

    assessmentHistory:
      assessmentHistoryResult.rows,
  };
};


// ======================================================
// CREATE PATIENT
// ======================================================

export const createPatient = async (
  doctorId: number,
  data: CreatePatientRequest,
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // --------------------------------------------------
    // Create patient
    // --------------------------------------------------

    const patientResult =
      await client.query(
        `
        INSERT INTO patients
        (
          doctor_id,
          name,
          age,
          gender,
          phone,
          email,
          blood_group
        )

        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )

        RETURNING
          id,
          name,
          age,
          gender,
          phone,
          email,
          blood_group AS "bloodGroup",
          created_at AS "createdAt"
        `,
        [
          doctorId,
          data.name,
          data.age,
          data.gender,
          data.phone ?? null,
          data.email ?? null,
          data.bloodGroup ?? null,
        ],
      );

    const patient =
      patientResult.rows[0];

    // --------------------------------------------------
    // Conditions
    // --------------------------------------------------

    if (data.conditions) {
      for (
        const condition
        of data.conditions
      ) {
        const trimmedCondition =
          condition.trim();

        if (!trimmedCondition) {
          continue;
        }

        await client.query(
          `
          INSERT INTO patient_conditions
          (
            patient_id,
            condition_name
          )

          VALUES
          ($1, $2)
          `,
          [
            patient.id,
            trimmedCondition,
          ],
        );
      }
    }

    // --------------------------------------------------
    // Allergies
    // --------------------------------------------------

    if (data.allergies) {
      for (
        const allergy
        of data.allergies
      ) {
        const trimmedAllergy =
          allergy.trim();

        if (!trimmedAllergy) {
          continue;
        }

        await client.query(
          `
          INSERT INTO patient_allergies
          (
            patient_id,
            allergy_name
          )

          VALUES
          ($1, $2)
          `,
          [
            patient.id,
            trimmedAllergy,
          ],
        );
      }
    }

    await client.query("COMMIT");

    return getPatientById(
      patient.id,
      doctorId,
    );
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

const assertPatientOwnership = async (
  doctorId: number,
  patientId: number,
) => {
  const result = await pool.query(
    "SELECT 1 FROM patients WHERE id = $1 AND doctor_id = $2",
    [patientId, doctorId],
  );
  if (result.rowCount === 0) {
    throw new Error("Patient not found");
  }
};

export const updatePatient = async (
  doctorId: number,
  patientId: number,
  data: UpdatePatientRequest,
) => {
  const result = await pool.query(
    `
    UPDATE patients SET
      name = $3, age = $4, gender = $5, phone = $6,
      email = $7, blood_group = $8
    WHERE id = $1 AND doctor_id = $2
    RETURNING id
    `,
    [
      patientId,
      doctorId,
      data.name,
      data.age,
      data.gender,
      data.phone ?? null,
      data.email ?? null,
      data.bloodGroup ?? null,
    ],
  );
  if (result.rowCount === 0) {
    return null;
  }
  return getPatientById(patientId, doctorId);
};

export const addPatientCondition = async (
  doctorId: number,
  patientId: number,
  data: PatientConditionInput,
) => {
  await assertPatientOwnership(doctorId, patientId);
  await pool.query(
    `
    INSERT INTO patient_conditions
      (patient_id, condition_name, diagnosis_date, status, clinical_notes)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      patientId,
      data.conditionName.trim(),
      data.diagnosisDate ?? null,
      data.status ?? "current",
      data.clinicalNotes ?? null,
    ],
  );
  return getPatientById(patientId, doctorId);
};

export const addPatientAllergy = async (
  doctorId: number,
  patientId: number,
  data: PatientAllergyInput,
) => {
  await assertPatientOwnership(doctorId, patientId);
  await pool.query(
    `
    INSERT INTO patient_allergies
      (patient_id, allergy_name, reaction, severity, verification_status)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      patientId,
      data.allergyName.trim(),
      data.reaction ?? null,
      data.severity ?? "unknown",
      data.verificationStatus ?? "patient_reported",
    ],
  );
  return getPatientById(patientId, doctorId);
};

export const addPatientMedication = async (
  doctorId: number,
  patientId: number,
  data: PatientMedicationInput,
) => {
  await assertPatientOwnership(doctorId, patientId);
  await pool.query(
    `
    INSERT INTO patient_medications (
      patient_id, medicine_id, dosage, frequency, start_date, end_date,
      treatment_status, treatment_duration, discontinuation_date,
      discontinuation_reason, adverse_reaction
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
    [
      patientId,
      data.medicineId,
      data.dosage ?? null,
      data.frequency ?? null,
      data.startDate ?? null,
      data.endDate ?? null,
      data.treatmentStatus ?? "current",
      data.treatmentDuration ?? null,
      data.discontinuationDate ?? null,
      data.discontinuationReason ?? null,
      data.adverseReaction ?? null,
    ],
  );
  return getPatientById(patientId, doctorId);
};

export const addPatientReaction = async (
  doctorId: number,
  patientId: number,
  data: PatientAdverseReactionInput,
) => {
  await assertPatientOwnership(doctorId, patientId);
  await pool.query(
    `
    INSERT INTO patient_adverse_reactions (
      patient_id, medicine_id, suspected_medicine, reaction, severity,
      started_at, duration, medication_stopped,
      symptoms_resolved_after_stopping, symptoms_returned_after_restarting,
      treatment_received, outcome, clinical_notes, reporter_type,
      verification_status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `,
    [
      patientId,
      data.medicineId ?? null,
      data.suspectedMedicine.trim(),
      data.reaction.trim(),
      data.severity ?? "unknown",
      data.startedAt ?? null,
      data.duration ?? null,
      data.medicationStopped ?? null,
      data.symptomsResolvedAfterStopping ?? null,
      data.symptomsReturnedAfterRestarting ?? null,
      data.treatmentReceived ?? null,
      data.outcome ?? null,
      data.clinicalNotes ?? null,
      data.reporterType ?? "patient_reported",
      data.verificationStatus ?? "unverified",
    ],
  );
  return getPatientById(patientId, doctorId);
};

export const addPatientMeasurement = async (
  doctorId: number,
  patientId: number,
  data: PatientMeasurementInput,
) => {
  await assertPatientOwnership(doctorId, patientId);
  await pool.query(
    `
    INSERT INTO patient_measurements (
      patient_id, measurement_name, value, value_text, unit,
      systolic_value, diastolic_value, measured_at, clinical_notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::timestamp, CURRENT_TIMESTAMP), $9)
    `,
    [
      patientId,
      data.measurementName.trim(),
      data.value ?? null,
      data.valueText ?? null,
      data.unit ?? null,
      data.systolicValue ?? null,
      data.diastolicValue ?? null,
      data.measuredAt ?? null,
      data.clinicalNotes ?? null,
    ],
  );
  return getPatientById(patientId, doctorId);
};

export const addPatientClinicalNote = async (
  doctorId: number,
  patientId: number,
  note: string,
) => {
  await assertPatientOwnership(doctorId, patientId);
  await pool.query(
    "INSERT INTO patient_clinical_notes (patient_id, doctor_id, note) VALUES ($1, $2, $3)",
    [patientId, doctorId, note.trim()],
  );
  return getPatientById(patientId, doctorId);
};