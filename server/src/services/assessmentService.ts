import pool from "../config/database.js";

import {
  predictADR,
  analyzePatientSafety,
  type FlaskMedicine,
  type FlaskPatientContext,
  type FlaskPatientSafetyData,
} from "./flaskService.js";

interface AssessmentInput {
  doctorId: number;
  patientId: number;
  medicineId: number;
}

export interface AssessmentResult {
  assessmentId: number | null;
  createdAt: string | null;

  patient: {
    id: number;
    name: string;
    age: number;
    gender: string;
    conditions: string[];
    allergies: string[];
    medications: {
      id: number;
      medicineId: number;
      medicineName: string;
      dosage: string | null;
      frequency: string | null;
    }[];
  };

  medicine: {
    id: number;
    name: string;
    genericName: string | null;
    uses: string[];
    therapeuticClass: string | null;
    actionClass: string | null;
    chemicalClass: string | null;
    habitForming: boolean;
  };

  documentedSideEffects: string[];

  prediction: {
    medicineText: string;
    predictedADRs: { adr: string; score: number }[];
    threshold: number;
    topScores: { adr: string; score: number }[];
  };

  predictions: {
    adr: string;
    score: number;
    probability: number | null;
  }[];

  patientSafety: FlaskPatientSafetyData;
  riskLevel: string;
  confidence: number;
}

const calculateRisk = (
  predictions: { adr: string; score: number }[],
) => {
  if (predictions.length === 0) {
    return { riskLevel: "Low", confidence: 0 };
  }

  const highestScore = predictions[0].score;

  let riskLevel = "Low";
  if (highestScore >= 0.8) {
    riskLevel = "High";
  } else if (highestScore >= 0.5) {
    riskLevel = "Moderate";
  }

  const confidence = Number(
    Math.min(Math.max(highestScore, 0), 1).toFixed(6),
  );

  return { riskLevel, confidence };
};

const createSafetyUnavailableResult =
  (): FlaskPatientSafetyData => ({
    hasAlerts: true,
    alertCount: 1,
    criticalCount: 0,
    warningCount: 1,
    infoCount: 0,
    alerts: [
      {
        type: "general",
        severity: "warning",
        title: "Patient safety analysis unavailable",
        message:
          "The patient-specific safety service could not be reached. Do not interpret this assessment as confirming that the selected medicine is safe for this patient.",
        evidence: "Safety API unavailable",
      },
    ],
    summary: {
      allergyConflict: false,
      currentMedicationConflict: false,
      conditionReviewRequired: true,
      ageReviewRequired: true,
    },
  });

/**
 * Evaluates a patient/medicine combination.
 *
 * IMPORTANT:
 * This function DOES NOT write anything to the database.
 * It is safe to call while the doctor is only reviewing options.
 */
export const evaluateAssessment = async ({
  doctorId,
  patientId,
  medicineId,
}: AssessmentInput): Promise<AssessmentResult> => {
  const client = await pool.connect();

  try {
    const patientResult = await client.query(
      `
      SELECT id, name, age, gender
      FROM patients
      WHERE id = $1 AND doctor_id = $2
      `,
      [patientId, doctorId],
    );

    if (patientResult.rows.length === 0) {
      throw new Error("Patient not found");
    }

    const patient = patientResult.rows[0];

    const conditionsResult = await client.query(
      `
      SELECT condition_name
      FROM patient_conditions
      WHERE patient_id = $1
      ORDER BY id
      `,
      [patientId],
    );

    const conditions = conditionsResult.rows.map(
      (row) => row.condition_name,
    );

    const allergiesResult = await client.query(
      `
      SELECT allergy_name
      FROM patient_allergies
      WHERE patient_id = $1
      ORDER BY id
      `,
      [patientId],
    );

    const allergies = allergiesResult.rows.map(
      (row) => row.allergy_name,
    );

    const medicationsResult = await client.query(
      `
      SELECT
        pm.id,
        pm.medicine_id AS "medicineId",
        m.name AS "medicineName",
        pm.dosage,
        pm.frequency
      FROM patient_medications pm
      INNER JOIN medicines m ON pm.medicine_id = m.id
      WHERE pm.patient_id = $1
      ORDER BY pm.created_at DESC
      `,
      [patientId],
    );

    const medications = medicationsResult.rows;

    const medicineResult = await client.query(
      `
      SELECT
        id,
        name,
        generic_name AS "genericName",
        therapeutic_class AS "therapeuticClass",
        action_class AS "actionClass",
        chemical_class AS "chemicalClass",
        habit_forming AS "habitForming"
      FROM medicines
      WHERE id = $1
      `,
      [medicineId],
    );

    if (medicineResult.rows.length === 0) {
      throw new Error("Medicine not found");
    }

    const medicine = medicineResult.rows[0];

    const usesResult = await client.query(
      `
      SELECT use_name
      FROM medicine_uses
      WHERE medicine_id = $1
      ORDER BY id
      `,
      [medicineId],
    );

    const uses = usesResult.rows.map(
      (row) => row.use_name,
    );

    const sideEffectsResult = await client.query(
      `
      SELECT side_effect_name
      FROM medicine_side_effects
      WHERE medicine_id = $1
      ORDER BY id
      `,
      [medicineId],
    );

    const documentedSideEffects =
      sideEffectsResult.rows.map(
        (row) => row.side_effect_name,
      );

    const flaskMedicine: FlaskMedicine = {
      name: medicine.name,
      genericName: medicine.genericName,
      uses,
      therapeuticClass: medicine.therapeuticClass,
      actionClass: medicine.actionClass,
      chemicalClass: medicine.chemicalClass,
      habitForming: medicine.habitForming,
    };

    const flaskPatient: FlaskPatientContext = {
      age: Number(patient.age),
      gender: String(patient.gender),
      conditions,
      allergies,
      medications: medications.map(
        (medication) => medication.medicineName,
      ),
    };

    const mlResult = await predictADR(flaskMedicine);

    if (
      !mlResult ||
      mlResult.success !== true ||
      !mlResult.data ||
      !Array.isArray(mlResult.data.predictedADRs)
    ) {
      throw new Error("Invalid response from ML service");
    }

    let patientSafety: FlaskPatientSafetyData;

    try {
      const safetyResult = await analyzePatientSafety(
        flaskPatient,
        flaskMedicine,
      );
      patientSafety = safetyResult.data;
    } catch (error) {
      console.error("Patient safety API failed:", error);
      patientSafety = createSafetyUnavailableResult();
    }

    const predictions = mlResult.data.predictedADRs
      .map((prediction) => ({
        adr: String(prediction.adr ?? "").trim(),
        score: Number(prediction.score),
        probability: null,
      }))
      .filter(
        (prediction) =>
          prediction.adr.length > 0 &&
          Number.isFinite(prediction.score),
      )
      .sort((a, b) => b.score - a.score);

    const { riskLevel, confidence } =
      calculateRisk(predictions);

    return {
      // Preview has no database ID.
      assessmentId: null,
      createdAt: null,

      patient: {
        id: patient.id,
        name: patient.name,
        age: Number(patient.age),
        gender: patient.gender,
        conditions,
        allergies,
        medications,
      },

      medicine: {
        id: medicine.id,
        name: medicine.name,
        genericName: medicine.genericName,
        uses,
        therapeuticClass: medicine.therapeuticClass,
        actionClass: medicine.actionClass,
        chemicalClass: medicine.chemicalClass,
        habitForming: medicine.habitForming,
      },

      documentedSideEffects,

      prediction: {
        medicineText: mlResult.data.medicineText,
        predictedADRs: predictions.map(
          (prediction) => ({
            adr: prediction.adr,
            score: prediction.score,
          }),
        ),
        threshold: mlResult.data.threshold,
        topScores: mlResult.data.topScores ?? [],
      },

      predictions,
      patientSafety,
      riskLevel,
      confidence,
    };
  } finally {
    client.release();
  }
};

/**
 * Finalizes an assessment after the doctor explicitly selects
 * the medicine to be given to the patient.
 *
 * The model is run again for the final medicine so the database
 * always contains the result for the medicine that was actually selected.
 */
export const saveAssessment = async ({
  doctorId,
  patientId,
  medicineId,
}: AssessmentInput): Promise<AssessmentResult> => {
  const evaluated = await evaluateAssessment({
    doctorId,
    patientId,
    medicineId,
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const assessmentResult = await client.query(
      `
      INSERT INTO assessments
      (
        doctor_id,
        patient_id,
        medicine_id,
        risk_level,
        confidence,
        patient_name_snapshot,
        patient_age_snapshot,
        patient_gender_snapshot,
        patient_conditions_snapshot,
        patient_allergies_snapshot
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING
        id,
        created_at AS "createdAt"
      `,
      [
        doctorId,
        patientId,
        medicineId,
        evaluated.riskLevel,
        evaluated.confidence,
        evaluated.patient.name,
        evaluated.patient.age,
        evaluated.patient.gender,
        JSON.stringify(evaluated.patient.conditions),
        JSON.stringify(evaluated.patient.allergies),
      ],
    );

    const assessment = assessmentResult.rows[0];

    for (const prediction of evaluated.predictions) {
      await client.query(
        `
        INSERT INTO assessment_adrs
        (
          assessment_id,
          adr_name,
          probability,
          score
        )
        VALUES ($1, $2, $3, $4)
        `,
        [
          assessment.id,
          prediction.adr,
          prediction.probability,
          prediction.score,
        ],
      );
    }

    await client.query("COMMIT");

    return {
      ...evaluated,
      assessmentId: Number(assessment.id),
      createdAt: assessment.createdAt,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Backwards-compatible name for any internal imports.
 * It now means "save/finalize", not "preview".
 */
export const runAssessment = saveAssessment;
