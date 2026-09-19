import pool from "../config/database.js";

import {
  predictADR,
  analyzePatientSafety,
  type FlaskMedicine,
  type FlaskPatientContext,
  type FlaskPatientSafetyData,
} from "./flaskService.js";


// ======================================================
// TYPES
// ======================================================

interface RunAssessmentInput {
  doctorId: number;

  patientId: number;

  medicineId: number;
}


interface AssessmentResult {
  assessmentId: number;

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

    predictedADRs: {
      adr: string;

      score: number;
    }[];

    threshold: number;

    topScores: {
      adr: string;

      score: number;
    }[];
  };

  predictions: {
    adr: string;

    score: number;

    probability: number | null;
  }[];

  patientSafety: FlaskPatientSafetyData;

  riskLevel: string;

  confidence: number;

  createdAt: string;
}


// ======================================================
// MODEL OUTPUT LEVEL
//
// IMPORTANT:
// This is NOT clinical patient risk.
// It only categorizes the strongest model score.
// ======================================================

const calculateRisk = (
  predictions: {
    adr: string;

    score: number;
  }[],
): {
  riskLevel: string;

  confidence: number;
} => {

  if (
    predictions.length === 0
  ) {

    return {
      riskLevel: "Low",

      confidence: 0,
    };
  }


  const highestScore =
    predictions[0].score;


  let riskLevel: string;


  if (
    highestScore >= 0.8
  ) {

    riskLevel = "High";

  } else if (
    highestScore >= 0.5
  ) {

    riskLevel = "Moderate";

  } else {

    riskLevel = "Low";
  }


  const confidence =
    Number(
      Math.min(
        Math.max(
          highestScore,
          0,
        ),
        1,
      ).toFixed(6),
    );


  return {
    riskLevel,

    confidence,
  };
};


// ======================================================
// EMPTY SAFETY RESULT
//
// Used only if the Flask safety endpoint fails.
// We explicitly show that safety analysis is unavailable.
// ======================================================

const createSafetyUnavailableResult =
  (): FlaskPatientSafetyData => {

    return {

      hasAlerts: true,

      alertCount: 1,

      criticalCount: 0,

      warningCount: 1,

      infoCount: 0,

      alerts: [
        {
          type: "general",

          severity: "warning",

          title:
            "Patient safety analysis unavailable",

          message:
            "The patient-specific safety service could not be reached. Do not interpret this assessment as confirming that the selected medicine is safe for this patient.",

          evidence:
            "Safety API unavailable",
        },
      ],

      summary: {

        allergyConflict: false,

        currentMedicationConflict: false,

        conditionReviewRequired: true,

        ageReviewRequired: true,
      },
    };
  };


// ======================================================
// RUN ASSESSMENT
// ======================================================

export const runAssessment = async ({
  doctorId,

  patientId,

  medicineId,
}: RunAssessmentInput): Promise<AssessmentResult> => {

  const client =
    await pool.connect();


  try {

    // ==================================================
    // 1. GET PATIENT
    // ==================================================

    const patientResult =
      await client.query(
        `
        SELECT
          id,
          name,
          age,
          gender

        FROM patients

        WHERE id = $1
          AND doctor_id = $2
        `,
        [
          patientId,

          doctorId,
        ],
      );


    if (
      patientResult.rows.length === 0
    ) {

      throw new Error(
        "Patient not found",
      );
    }


    const patient =
      patientResult.rows[0];


    // ==================================================
    // 2. CONDITIONS
    // ==================================================

    const conditionsResult =
      await client.query(
        `
        SELECT
          condition_name

        FROM patient_conditions

        WHERE patient_id = $1

        ORDER BY id
        `,
        [
          patientId,
        ],
      );


    const conditions =
      conditionsResult.rows.map(
        (row) =>
          row.condition_name,
      );


    // ==================================================
    // 3. ALLERGIES
    // ==================================================

    const allergiesResult =
      await client.query(
        `
        SELECT
          allergy_name

        FROM patient_allergies

        WHERE patient_id = $1

        ORDER BY id
        `,
        [
          patientId,
        ],
      );


    const allergies =
      allergiesResult.rows.map(
        (row) =>
          row.allergy_name,
      );


    // ==================================================
    // 4. CURRENT MEDICATIONS
    // ==================================================

    const medicationsResult =
      await client.query(
        `
        SELECT
          pm.id,

          pm.medicine_id
            AS "medicineId",

          m.name
            AS "medicineName",

          pm.dosage,

          pm.frequency

        FROM patient_medications pm

        INNER JOIN medicines m
          ON pm.medicine_id = m.id

        WHERE pm.patient_id = $1

        ORDER BY pm.created_at DESC
        `,
        [
          patientId,
        ],
      );


    const medications =
      medicationsResult.rows;


    // ==================================================
    // 5. MEDICINE
    // ==================================================

    const medicineResult =
      await client.query(
        `
        SELECT
          id,

          name,

          generic_name
            AS "genericName",

          therapeutic_class
            AS "therapeuticClass",

          action_class
            AS "actionClass",

          chemical_class
            AS "chemicalClass",

          habit_forming
            AS "habitForming"

        FROM medicines

        WHERE id = $1
        `,
        [
          medicineId,
        ],
      );


    if (
      medicineResult.rows.length === 0
    ) {

      throw new Error(
        "Medicine not found",
      );
    }


    const medicine =
      medicineResult.rows[0];


    // ==================================================
    // 6. MEDICINE USES
    // ==================================================

    const usesResult =
      await client.query(
        `
        SELECT
          use_name

        FROM medicine_uses

        WHERE medicine_id = $1

        ORDER BY id
        `,
        [
          medicineId,
        ],
      );


    const uses =
      usesResult.rows.map(
        (row) =>
          row.use_name,
      );


    // ==================================================
    // 7. DOCUMENTED SIDE EFFECTS
    // ==================================================

    const sideEffectsResult =
      await client.query(
        `
        SELECT
          side_effect_name

        FROM medicine_side_effects

        WHERE medicine_id = $1

        ORDER BY id
        `,
        [
          medicineId,
        ],
      );


    const documentedSideEffects =
      sideEffectsResult.rows.map(
        (row) =>
          row.side_effect_name,
      );


    // ==================================================
    // 8. PREPARE MEDICINE
    // ==================================================

    const flaskMedicine:
      FlaskMedicine = {

      name:
        medicine.name,

      genericName:
        medicine.genericName,

      uses,

      therapeuticClass:
        medicine.therapeuticClass,

      actionClass:
        medicine.actionClass,

      chemicalClass:
        medicine.chemicalClass,

      habitForming:
        medicine.habitForming,
    };


    // ==================================================
    // 9. PREPARE PATIENT CONTEXT
    // ==================================================

    const flaskPatient:
      FlaskPatientContext = {

      age:
        Number(
          patient.age,
        ),

      gender:
        String(
          patient.gender,
        ),

      conditions,

      allergies,

      medications:
        medications.map(
          (
            medication,
          ) =>
            medication.medicineName,
        ),
    };


    // ==================================================
    // 10. EXISTING ADR MODEL
    // ==================================================

    const mlResult =
      await predictADR(
        flaskMedicine,
      );


    if (
      !mlResult ||
      mlResult.success !== true ||
      !mlResult.data ||
      !Array.isArray(
        mlResult.data.predictedADRs,
      )
    ) {

      throw new Error(
        "Invalid response from ML service",
      );
    }


    // ==================================================
    // 11. PATIENT SAFETY API
    // ==================================================

    let patientSafety:
      FlaskPatientSafetyData;


    try {

      const safetyResult =
        await analyzePatientSafety(
          flaskPatient,

          flaskMedicine,
        );


      patientSafety =
        safetyResult.data;

    } catch (safetyError) {

      console.error(
        "Patient safety API failed:",
        safetyError,
      );


      patientSafety =
        createSafetyUnavailableResult();
    }


    // ==================================================
    // 12. NORMALIZE ADR PREDICTIONS
    // ==================================================

    const predictions =
      mlResult.data.predictedADRs

        .map(
          (
            prediction,
          ) => {

            const adr =
              String(
                prediction.adr ??
                  "",
              ).trim();


            const score =
              Number(
                prediction.score,
              );


            return {

              adr,

              score,

              probability:
                null,
            };
          },
        )

        .filter(
          (
            prediction,
          ) =>
            prediction.adr.length > 0 &&
            Number.isFinite(
              prediction.score,
            ),
        )

        .sort(
          (
            a,
            b,
          ) =>
            b.score -
            a.score,
        );


    // ==================================================
    // 13. MODEL OUTPUT LEVEL
    // ==================================================

    const {
      riskLevel,

      confidence,
    } =
      calculateRisk(
        predictions,
      );


    // ==================================================
    // 14. SAVE ASSESSMENT
    // ==================================================

    const assessmentResult =
      await client.query(
        `
        INSERT INTO assessments
        (
          doctor_id,

          patient_id,

          medicine_id,

          risk_level,

          confidence
        )

        VALUES
        (
          $1,

          $2,

          $3,

          $4,

          $5
        )

        RETURNING
          id,

          created_at
            AS "createdAt"
        `,
        [
          doctorId,

          patientId,

          medicineId,

          riskLevel,

          confidence,
        ],
      );


    const assessment =
      assessmentResult.rows[0];


    // ==================================================
    // 15. SAVE ADR PREDICTIONS
    // ==================================================

    for (
      const prediction
      of predictions
    ) {

      await client.query(
        `
        INSERT INTO assessment_adrs
        (
          assessment_id,

          adr_name,

          probability,

          score
        )

        VALUES
        (
          $1,

          $2,

          $3,

          $4
        )
        `,
        [
          assessment.id,

          prediction.adr,

          null,

          prediction.score,
        ],
      );
    }


    // ==================================================
    // 16. RETURN RESULT
    // ==================================================

    return {

      assessmentId:
        assessment.id,

      patient: {

        id:
          patient.id,

        name:
          patient.name,

        age:
          Number(
            patient.age,
          ),

        gender:
          patient.gender,

        conditions,

        allergies,

        medications,
      },

      medicine: {

        id:
          medicine.id,

        name:
          medicine.name,

        genericName:
          medicine.genericName,

        uses,

        therapeuticClass:
          medicine.therapeuticClass,

        actionClass:
          medicine.actionClass,

        chemicalClass:
          medicine.chemicalClass,

        habitForming:
          medicine.habitForming,
      },

      documentedSideEffects,

      prediction: {

        medicineText:
          mlResult.data.medicineText,

        predictedADRs:
          predictions.map(
            (
              prediction,
            ) => ({
              adr:
                prediction.adr,

              score:
                prediction.score,
            }),
          ),

        threshold:
          mlResult.data.threshold,

        topScores:
          mlResult.data.topScores,
      },

      predictions,

      patientSafety,

      riskLevel,

      confidence,

      createdAt:
        assessment.createdAt,
    };

  } catch (error) {

    throw error;

  } finally {

    client.release();
  }
};