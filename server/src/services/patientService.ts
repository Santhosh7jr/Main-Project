import pool from "../config/database.js";

import type {
  CreatePatientRequest,
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

      COALESCE(
        ARRAY_AGG(DISTINCT pc.condition_name)
        FILTER (
          WHERE pc.condition_name IS NOT NULL
        ),
        '{}'
      ) AS conditions,

      COALESCE(
        ARRAY_AGG(DISTINCT pa.allergy_name)
        FILTER (
          WHERE pa.allergy_name IS NOT NULL
        ),
        '{}'
      ) AS allergies

    FROM patients p

    LEFT JOIN patient_conditions pc
      ON p.id = pc.patient_id

    LEFT JOIN patient_allergies pa
      ON p.id = pa.patient_id

    WHERE p.doctor_id = $1

    GROUP BY p.id

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
      SELECT condition_name
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
      SELECT allergy_name
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
        pm.end_date AS "endDate"

      FROM patient_medications pm

      JOIN medicines m
        ON pm.medicine_id = m.id

      WHERE pm.patient_id = $1

      ORDER BY pm.created_at DESC
      `,
      [patientId],
    );

  return {
    ...patient,

    conditions:
      conditionsResult.rows.map(
        (row) => row.condition_name,
      ),

    allergies:
      allergiesResult.rows.map(
        (row) => row.allergy_name,
      ),

    medications:
      medicationsResult.rows,
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