import pool from "../config/database.js";

export type RiskLevel = "Low" | "Moderate" | "High" | "Unavailable";

export interface ReportAssessment {
  id: number;
  patientId: number;
  patientName: string;
  medicineId: number;
  medicineName: string;
  riskLevel: RiskLevel;
  confidence: number | null;
  createdAt: string;
  adrCount: number;
  patientMedicationId: number | null;
  dosage: string | null;
  frequency: string | null;
  endDate: string | null;
  doctorDecision: "prescribed" | "not_prescribed" | "deferred" | null;
  currentComplaints: string[];
  newlyReportedReactions: string[];
  patientContextSnapshot: Record<string, unknown>;
  patientSafetySnapshot: Record<string, unknown>;
  patientSnapshot: {
    age: number | null;
    gender: string | null;
    conditions: string[];
    allergies: string[];
    medications: unknown[];
    adverseReactions: unknown[];
    measurements: unknown[];
  };
  actualOutcome: string | null;
  alternatives: {
    medicineId: number;
    medicineName: string;
    reviewStatus: string;
    doctorDecision: "selected" | "rejected" | "deferred" | null;
    similarity: number | null;
    reason: string | null;
    patientWarnings: string[];
    previousReactionMatches: string[];
  }[];
  predictions?: {
    adr: string;
    score: number | null;
    probability: number | null;
  }[];
}

export interface RiskBucket {
  riskLevel: RiskLevel;
  count: number;
}

export interface ReportSummary {
  totalPatients: number;
  totalAssessments: number;
  medicinesReviewed: number;
  adrsIdentified: number;
  assessmentsThisWeek: number;
  recentAssessments: ReportAssessment[];
}

const normalizeRiskLevel = (value: unknown): RiskLevel => {
  if (value === "High" || value === "Moderate" || value === "Low") {
    return value;
  }

  return "Unavailable";
};

const toCount = (value: unknown) => Number(value ?? 0);

const toDateOnly = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
};

const mapAssessmentRow = (row: Record<string, unknown>): ReportAssessment => ({
  id: Number(row.id),
  patientId: Number(row.patientId),
  patientName: String(row.patientName ?? ""),
  medicineId: Number(row.medicineId),
  medicineName: String(row.medicineName ?? ""),
  riskLevel: normalizeRiskLevel(row.riskLevel),
  confidence: row.confidence == null ? null : Number(row.confidence),
  createdAt: String(row.createdAt),
  adrCount: Number(row.adrCount ?? 0),
  patientMedicationId:
    row.patientMedicationId == null ? null : Number(row.patientMedicationId),
  dosage: row.dosage == null ? null : String(row.dosage),
  frequency: row.frequency == null ? null : String(row.frequency),
  endDate: toDateOnly(row.endDate),
  doctorDecision: (row.doctorDecision as ReportAssessment["doctorDecision"]) ?? null,
  currentComplaints: Array.isArray(row.currentComplaints)
    ? row.currentComplaints as string[]
    : [],
  newlyReportedReactions: Array.isArray(row.newlyReportedReactions)
    ? row.newlyReportedReactions as string[]
    : [],
  patientContextSnapshot:
    row.patientContextSnapshot && typeof row.patientContextSnapshot === "object"
      ? row.patientContextSnapshot as Record<string, unknown>
      : {},
  patientSnapshot: {
    age: row.patientAge == null ? null : Number(row.patientAge),
    gender: row.patientGender == null ? null : String(row.patientGender),
    conditions: Array.isArray(row.patientConditions) ? row.patientConditions as string[] : [],
    allergies: Array.isArray(row.patientAllergies) ? row.patientAllergies as string[] : [],
    medications: Array.isArray(row.patientMedications) ? row.patientMedications : [],
    adverseReactions: Array.isArray(row.patientReactions) ? row.patientReactions : [],
    measurements: Array.isArray(row.patientMeasurements) ? row.patientMeasurements : [],
  },
  patientSafetySnapshot:
    row.patientSafetySnapshot && typeof row.patientSafetySnapshot === "object"
      ? row.patientSafetySnapshot as Record<string, unknown>
      : {},
  actualOutcome: row.actualOutcome == null ? null : String(row.actualOutcome),
  alternatives: Array.isArray(row.alternatives)
    ? row.alternatives as ReportAssessment["alternatives"]
    : [],
  predictions: Array.isArray(row.predictions)
    ? (row.predictions as ReportAssessment["predictions"])
    : undefined,
});

export const listAssessmentReports = async (
  doctorId: number,
): Promise<ReportAssessment[]> => {
  const result = await pool.query(
    `
    SELECT
      a.id,
      p.id AS "patientId",
      COALESCE(a.patient_name_snapshot, p.name) AS "patientName",
      a.patient_age_snapshot AS "patientAge",
      a.patient_gender_snapshot AS "patientGender",
      COALESCE(a.patient_conditions_snapshot, '[]'::jsonb) AS "patientConditions",
      COALESCE(a.patient_allergies_snapshot, '[]'::jsonb) AS "patientAllergies",
      COALESCE(a.patient_medications_snapshot, '[]'::jsonb) AS "patientMedications",
      COALESCE(a.patient_reactions_snapshot, '[]'::jsonb) AS "patientReactions",
      COALESCE(a.patient_measurements_snapshot, '[]'::jsonb) AS "patientMeasurements",
      m.id AS "medicineId",
      m.name AS "medicineName",
      COALESCE(a.risk_level, 'Unavailable') AS "riskLevel",
      a.confidence::float AS confidence,
      a.created_at AS "createdAt",
      COUNT(aa.id)::int AS "adrCount",
      pm.id AS "patientMedicationId",
      pm.dosage,
      pm.frequency,
      pm.end_date AS "endDate",
      a.doctor_decision AS "doctorDecision",
      a.current_complaints AS "currentComplaints",
      a.newly_reported_reactions AS "newlyReportedReactions",
      a.patient_context_snapshot AS "patientContextSnapshot",
      a.patient_safety_snapshot AS "patientSafetySnapshot",
      a.actual_outcome AS "actualOutcome",
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
      ) AS predictions,
      COALESCE(alt.alternatives, '[]'::jsonb) AS alternatives
    FROM assessments a
    JOIN patients p
      ON p.id = a.patient_id
    JOIN medicines m
      ON m.id = a.medicine_id
    LEFT JOIN assessment_adrs aa
      ON aa.assessment_id = a.id
    LEFT JOIN LATERAL (
      SELECT id, dosage, frequency, end_date
      FROM patient_medications
      WHERE patient_id = a.patient_id
        AND medicine_id = a.medicine_id
        AND COALESCE(a.doctor_decision, 'prescribed') = 'prescribed'
        AND (
          id = a.patient_medication_id
          OR (
            a.patient_medication_id IS NULL
            AND created_at <= a.created_at
          )
        )
      ORDER BY created_at DESC
      LIMIT 1
    ) pm ON TRUE
    LEFT JOIN LATERAL (
      SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'medicineId', am.id,
          'medicineName', am.name,
          'reviewStatus', aa2.review_status,
          'doctorDecision', aa2.doctor_decision,
          'similarity', aa2.similarity::float,
          'reason', aa2.reason,
          'patientWarnings', aa2.patient_warnings,
          'previousReactionMatches', aa2.previous_reaction_matches
        )
        ORDER BY aa2.similarity DESC NULLS LAST
      ) AS alternatives
      FROM assessment_alternatives aa2
      JOIN medicines am ON am.id = aa2.medicine_id
      WHERE aa2.assessment_id = a.id
    ) alt ON TRUE
    WHERE a.doctor_id = $1
    GROUP BY
      a.id,
      p.id,
      p.name,
      m.id,
      m.name,
      a.risk_level,
      a.confidence,
      a.created_at,
      pm.id,
      pm.dosage,
      pm.frequency,
      pm.end_date,
      alt.alternatives
    ORDER BY a.created_at DESC
    LIMIT 100
    `,
    [doctorId],
  );

  return result.rows.map(mapAssessmentRow);
};

export const recordAlternativeDecision = async (
  doctorId: number,
  assessmentId: number,
  medicineId: number,
  decision: "selected" | "rejected" | "deferred",
) => {
  const reviewStatus = decision === "deferred" ? "reviewed" : decision;
  const result = await pool.query(
    `
    UPDATE assessment_alternatives aa
    SET review_status = $4,
        doctor_decision = $5,
        reviewed_at = CURRENT_TIMESTAMP
    FROM assessments a
    WHERE aa.assessment_id = a.id
      AND a.doctor_id = $1
      AND aa.assessment_id = $2
      AND aa.medicine_id = $3
    RETURNING aa.medicine_id AS "medicineId",
      aa.review_status AS "reviewStatus",
      aa.doctor_decision AS "doctorDecision",
      aa.reviewed_at AS "reviewedAt"
    `,
    [doctorId, assessmentId, medicineId, reviewStatus, decision],
  );
  return result.rows[0] ?? null;
};

export const readReportSummary = async (
  doctorId: number,
): Promise<ReportSummary> => {
  const [
    patientResult,
    assessmentResult,
    medicinesResult,
    adrResult,
    weekResult,
    recentResult,
  ] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS count FROM patients WHERE doctor_id = $1`,
      [doctorId],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM assessments WHERE doctor_id = $1`,
      [doctorId],
    ),
    pool.query(
      `SELECT COUNT(DISTINCT medicine_id)::int AS count FROM assessments WHERE doctor_id = $1`,
      [doctorId],
    ),
    pool.query(
      `SELECT COUNT(aa.id)::int AS count
       FROM assessment_adrs aa
       INNER JOIN assessments a ON a.id = aa.assessment_id
       WHERE a.doctor_id = $1`,
      [doctorId],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count
       FROM assessments
       WHERE doctor_id = $1
         AND created_at >= NOW() - INTERVAL '7 days'`,
      [doctorId],
    ),
    pool.query(
      `SELECT
        a.id,
        p.id AS "patientId",
        p.name AS "patientName",
        m.id AS "medicineId",
        m.name AS "medicineName",
        COALESCE(a.risk_level, 'Unavailable') AS "riskLevel",
        a.confidence::float AS confidence,
        a.created_at AS "createdAt",
        COUNT(aa.id)::int AS "adrCount"
       FROM assessments a
       JOIN patients p ON p.id = a.patient_id
       JOIN medicines m ON m.id = a.medicine_id
       LEFT JOIN assessment_adrs aa ON aa.assessment_id = a.id
       WHERE a.doctor_id = $1
       GROUP BY a.id, p.id, p.name, m.id, m.name, a.risk_level, a.confidence, a.created_at
       ORDER BY a.created_at DESC
       LIMIT 6`,
      [doctorId],
    ),
  ]);

  return {
    totalPatients: toCount(patientResult.rows[0]?.count),
    totalAssessments: toCount(assessmentResult.rows[0]?.count),
    medicinesReviewed: toCount(medicinesResult.rows[0]?.count),
    adrsIdentified: toCount(adrResult.rows[0]?.count),
    assessmentsThisWeek: toCount(weekResult.rows[0]?.count),
    recentAssessments: recentResult.rows.map(mapAssessmentRow),
  };
};
