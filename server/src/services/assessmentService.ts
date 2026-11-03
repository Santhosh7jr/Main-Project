import pool from "../config/database.js";
import { uniqueMedicineLabels } from "../utils/medicineData.js";

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
  currentComplaints?: string[];
  newlyReportedReactions?: string[];
}

interface SaveAssessmentInput extends AssessmentInput {
  dosage: string;
  frequency: string;
  endDate: string | null;
  doctorDecision: "prescribed" | "not_prescribed" | "deferred";
  alternativeMedicineIds: number[];
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
    previousMedications: {
      id: number;
      medicineId: number;
      medicineName: string;
      dosage: string | null;
      frequency: string | null;
      treatmentStatus: string;
      discontinuationReason: string | null;
    }[];
    adverseReactions: {
      id: number;
      suspectedMedicine: string;
      reaction: string;
      severity: string;
      verificationStatus: string;
    }[];
    measurements: {
      id: number;
      measurementName: string;
      value: number | null;
      valueText: string | null;
      unit: string | null;
      measuredAt: string;
    }[];
    currentComplaints: string[];
  };

  medicine: {
    id: number;
    name: string;
    genericName: string | null;
    uses: string[];
    therapeuticClass: string | null;
    actionClass: string | null;
    chemicalClass: string | null;
    habitForming: boolean | null;
  };

  documentedSideEffects: string[];
  knownSideEffects: {
    source: "medicine_dataset";
    items: string[];
  };

  prediction: {
    available: boolean;
    source: "machine_learning_model";
    scoreType: "model_score";
    medicineText: string;
    predictedADRs: {
      adr: string;
      score: number;
    }[];
    threshold: number | null;
    modelType?: string;
    trainingMetadata?: Record<string, unknown>;
    topScores: { adr: string; score: number }[];
    error?: string;
  };

  predictions: {
    adr: string;
    score: number;
    probability: number | null;
  }[];

  patientSafety: FlaskPatientSafetyData;
  riskLevel: "Low" | "Moderate" | "High" | "Unavailable";
  confidence: number | null;
  patientPersonalized: false;
  doctorDecision?: "prescribed" | "not_prescribed" | "deferred" | null;
  disclaimer: string;
}

const calculateRisk = (
  predictions: {
    adr: string;
    score: number;
  }[],
) => {
  if (predictions.length === 0) {
    return { riskLevel: "Unavailable" as const, confidence: null };
  }

  const highestScore = predictions[0].score;
  const strongScoreCount = predictions.filter((item) => item.score >= 1.0).length;
  const intermediateScoreCount = predictions.filter((item) => item.score >= 0.5).length;

  // Legacy database field `risk_level` stores a heuristic model-signal band,
  // not a clinically validated patient risk category.
  let riskLevel: "Low" | "Moderate" | "High" = "Low";
  if (strongScoreCount >= 2 || highestScore >= 1.5) {
    riskLevel = "High";
  } else if (strongScoreCount >= 1 || intermediateScoreCount >= 2 || highestScore >= 0.5) {
    riskLevel = "Moderate";
  }

  // Compatibility field only. This sigmoid transform is not calibrated and
  // must never be described as probability or clinical confidence.
  const confidence = Number((1 / (1 + Math.exp(-highestScore))).toFixed(6));

  return { riskLevel, confidence };
};

const createSafetyUnavailableResult = (): FlaskPatientSafetyData => ({
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
  currentComplaints = [],
  newlyReportedReactions = [],
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
      WHERE patient_id = $1 AND status = 'current'
      ORDER BY id
      `,
      [patientId],
    );

    const conditions = conditionsResult.rows.map((row) => row.condition_name);

    const allergiesResult = await client.query(
      `
      SELECT allergy_name
      FROM patient_allergies
      WHERE patient_id = $1
      ORDER BY id
      `,
      [patientId],
    );

    const allergies = allergiesResult.rows.map((row) => row.allergy_name);

    const medicationsResult = await client.query(
      `
      SELECT
        pm.id,
        pm.medicine_id AS "medicineId",
        m.name AS "medicineName",
        pm.dosage,
        pm.frequency,
        pm.start_date AS "startDate",
        pm.end_date AS "endDate",
        pm.treatment_status AS "treatmentStatus"
      FROM patient_medications pm
      INNER JOIN medicines m ON pm.medicine_id = m.id
      WHERE pm.patient_id = $1
        AND pm.treatment_status = 'current'
      ORDER BY pm.created_at DESC
      `,
      [patientId],
    );

    const medications = medicationsResult.rows;

    const previousMedicationsResult = await client.query(
      `
      SELECT
        pm.id,
        pm.medicine_id AS "medicineId",
        m.name AS "medicineName",
        pm.dosage,
        pm.frequency,
        pm.treatment_status AS "treatmentStatus",
        pm.discontinuation_reason AS "discontinuationReason"
      FROM patient_medications pm
      INNER JOIN medicines m ON m.id = pm.medicine_id
      WHERE pm.patient_id = $1
        AND pm.treatment_status <> 'current'
      ORDER BY COALESCE(pm.discontinuation_date, pm.end_date) DESC NULLS LAST, pm.created_at DESC
      `,
      [patientId],
    );

    const reactionsResult = await client.query(
      `
      SELECT id, suspected_medicine AS "suspectedMedicine", reaction,
        severity, verification_status AS "verificationStatus"
      FROM patient_adverse_reactions
      WHERE patient_id = $1
      ORDER BY COALESCE(started_at, created_at::date) DESC, id DESC
      `,
      [patientId],
    );

    const measurementsResult = await client.query(
      `
      SELECT
        id,
        measurement_name AS "measurementName",
        value::float AS value,
        value_text AS "valueText",
        unit,
        measured_at AS "measuredAt"
      FROM patient_measurements
      WHERE patient_id = $1
      ORDER BY measured_at DESC, id DESC
      LIMIT 50
      `,
      [patientId],
    );

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

    const reactions = [
      ...reactionsResult.rows,
      ...newlyReportedReactions
        .map((reaction) => reaction.trim())
        .filter(Boolean)
        .map((reaction) => ({
          id: 0,
          suspectedMedicine: medicine.name,
          reaction,
          severity: "unknown",
          verificationStatus: "patient_reported",
        })),
    ];

    const usesResult = await client.query(
      `
      SELECT use_name
      FROM medicine_uses
      WHERE medicine_id = $1
      ORDER BY id
      `,
      [medicineId],
    );

    const uses = usesResult.rows.map((row) => row.use_name);

    const sideEffectsResult = await client.query(
      `
      SELECT side_effect_name
      FROM medicine_side_effects
      WHERE medicine_id = $1
      ORDER BY id
      `,
      [medicineId],
    );

    const documentedSideEffects = uniqueMedicineLabels(
      sideEffectsResult.rows.map((row) => row.side_effect_name),
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
      medications: medications.map((medication) => medication.medicineName),
      previousMedications: previousMedicationsResult.rows.map((medication) => ({
        medicineName: medication.medicineName,
        dosage: medication.dosage,
        frequency: medication.frequency,
        discontinuationReason: medication.discontinuationReason ?? null,
      })),
      adverseReactions: reactions,
      measurements: measurementsResult.rows,
      currentComplaints: currentComplaints.map((complaint) => complaint.trim()).filter(Boolean),
    };

    let predictionAvailable = false;
    let predictionError: string | undefined;
    let mlPrediction: Awaited<ReturnType<typeof predictADR>>["data"] | null = null;
    try {
      const mlResult = await predictADR(flaskMedicine);
      if (
        mlResult.success !== true ||
        !mlResult.data ||
        !Array.isArray(mlResult.data.predictedADRs)
      ) {
        throw new Error("The ML service returned an invalid prediction response.");
      }
      predictionAvailable = true;
      mlPrediction = mlResult.data;
    } catch (error) {
      console.error("ADR prediction is unavailable:", error);
      predictionError =
        "Model predictions could not be generated. Known side effects and patient-safety information are shown separately.";
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

    const predictions = (mlPrediction?.predictedADRs ?? [])
      .map((prediction) => ({
        adr: String(prediction.adr ?? "").trim(),
        score: Number(prediction.score),
        probability: null,
      }))
      .filter(
        (prediction) =>
          prediction.adr.length > 0 && Number.isFinite(prediction.score),
      )
      .sort((a, b) => b.score - a.score);

    const { riskLevel, confidence } = calculateRisk(predictions);

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
        previousMedications: previousMedicationsResult.rows,
        adverseReactions: reactions,
        measurements: measurementsResult.rows,
        currentComplaints: flaskPatient.currentComplaints ?? [],
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
      knownSideEffects: {
        source: "medicine_dataset",
        items: documentedSideEffects,
      },

      prediction: {
        available: predictionAvailable,
        source: "machine_learning_model",
        scoreType: "model_score",
        medicineText: mlPrediction?.medicineText ?? "",
        predictedADRs: predictions.map((prediction) => ({
          adr: prediction.adr,
          score: prediction.score,
        })),
        threshold: mlPrediction?.threshold ?? null,
        ...(mlPrediction?.modelType ? { modelType: mlPrediction.modelType } : {}),
        ...(mlPrediction?.trainingMetadata
          ? { trainingMetadata: mlPrediction.trainingMetadata }
          : {}),
        topScores: mlPrediction?.topScores ?? [],
        ...(predictionError ? { error: predictionError } : {}),
      },

      predictions,
      patientSafety,
      riskLevel,
      confidence,
      patientPersonalized: false,
      disclaimer:
        "Model predictions are informational estimates based on medicine features and dataset patterns. They are not patient-specific, diagnostic, or medical advice. Consult a qualified healthcare professional for medical decisions.",
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
  dosage,
  frequency,
  endDate,
  doctorDecision = "prescribed",
  alternativeMedicineIds = [],
  currentComplaints = [],
  newlyReportedReactions = [],
}: SaveAssessmentInput): Promise<AssessmentResult> => {
  const evaluated = await evaluateAssessment({
    doctorId,
    patientId,
    medicineId,
    currentComplaints,
    newlyReportedReactions,
  });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let patientMedicationId: number | null = null;
    if (doctorDecision === "prescribed") {
      const currentMedication = await client.query(
        `
        SELECT id
        FROM patient_medications
        WHERE patient_id = $1
          AND medicine_id = $2
          AND treatment_status = 'current'
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
        `,
        [patientId, medicineId],
      );

      if (currentMedication.rows.length > 0) {
        const updatedMedication = await client.query(
          `
          UPDATE patient_medications
          SET dosage = $2,
              frequency = $3,
              end_date = $4,
              treatment_status = 'current'
          WHERE id = $1
          RETURNING id
          `,
          [currentMedication.rows[0].id, dosage, frequency, endDate],
        );
        patientMedicationId = Number(updatedMedication.rows[0].id);
      } else {
        const insertedMedication = await client.query(
          `
          INSERT INTO patient_medications
          (
            patient_id,
            medicine_id,
            dosage,
            frequency,
            start_date,
            end_date,
            treatment_status
          )
          VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'current')
          RETURNING id
          `,
          [patientId, medicineId, dosage, frequency, endDate],
        );
        patientMedicationId = Number(insertedMedication.rows[0].id);
      }
    }

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
        patient_allergies_snapshot,
        patient_medications_snapshot,
        patient_reactions_snapshot,
        patient_measurements_snapshot,
        patient_context_snapshot,
        patient_safety_snapshot,
        current_complaints,
        newly_reported_reactions,
        doctor_decision,
        patient_medication_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
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
        JSON.stringify(evaluated.patient.medications),
        JSON.stringify(evaluated.patient.adverseReactions),
        JSON.stringify(evaluated.patient.measurements),
        JSON.stringify({
          previousMedications: evaluated.patient.previousMedications,
          currentComplaints: evaluated.patient.currentComplaints,
        }),
        JSON.stringify(evaluated.patientSafety),
        JSON.stringify(evaluated.patient.currentComplaints),
        JSON.stringify(newlyReportedReactions),
        doctorDecision,
        patientMedicationId,
      ],
    );

    const assessment = assessmentResult.rows[0];

    if (alternativeMedicineIds.length > 0) {
      await client.query(
        `
        INSERT INTO assessment_alternatives (
          assessment_id,
          medicine_id,
          reason,
          review_status
        )
        SELECT $1, m.id, 'Shown during assessment', 'suggested'
        FROM medicines m
        WHERE m.id = ANY($2::int[])
          AND m.id <> $3
        `,
        [assessment.id, alternativeMedicineIds, medicineId],
      );
    }

    for (const complaint of evaluated.patient.currentComplaints) {
      await client.query(
        `
        INSERT INTO patient_complaints (patient_id, assessment_id, complaint)
        VALUES ($1, $2, $3)
        `,
        [patientId, assessment.id, complaint],
      );
    }

    for (const reaction of newlyReportedReactions) {
      const trimmedReaction = reaction.trim();
      if (!trimmedReaction) continue;
      await client.query(
        `
        INSERT INTO patient_adverse_reactions (
          patient_id, medicine_id, suspected_medicine, reaction,
          reporter_type, verification_status
        )
        VALUES ($1, $2, $3, $4, 'patient_reported', 'patient_reported')
        `,
        [patientId, medicineId, evaluated.medicine.name, trimmedReaction],
      );
    }

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
      doctorDecision,
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

export const recordAssessmentOutcome = async (
  doctorId: number,
  assessmentId: number,
  actualOutcome: string,
) => {
  const result = await pool.query(
    `
    UPDATE assessments a
    SET actual_outcome = $3,
        actual_outcome_at = CURRENT_TIMESTAMP
    FROM patients p
    WHERE a.patient_id = p.id
      AND a.id = $1
      AND a.doctor_id = $2
      AND p.doctor_id = $2
    RETURNING a.id AS "assessmentId", a.actual_outcome AS "actualOutcome",
      a.actual_outcome_at AS "actualOutcomeAt"
    `,
    [assessmentId, doctorId, actualOutcome.trim()],
  );
  return result.rows[0] ?? null;
};
