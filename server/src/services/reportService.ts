import pool from "../config/database.js";

export type RiskLevel =
  | "Low"
  | "Moderate"
  | "High";

export interface ReportAssessment {
  id: number;
  patientId: number;
  patientName: string;
  medicineId: number;
  medicineName: string;
  riskLevel: RiskLevel;
  confidence: number;
  createdAt: string;
  adrCount: number;
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

const normalizeRiskLevel = (
  value: unknown,
): RiskLevel => {
  if (
    value === "High" ||
    value === "Moderate" ||
    value === "Low"
  ) {
    return value;
  }

  return "Low";
};

const toCount = (
  value: unknown,
) => Number(value ?? 0);

const mapAssessmentRow = (
  row: Record<string, unknown>,
): ReportAssessment => ({
  id: Number(row.id),
  patientId: Number(row.patientId),
  patientName: String(row.patientName ?? ""),
  medicineId: Number(row.medicineId),
  medicineName: String(row.medicineName ?? ""),
  riskLevel: normalizeRiskLevel(row.riskLevel),
  confidence: Number(row.confidence ?? 0),
  createdAt: String(row.createdAt),
  adrCount: Number(row.adrCount ?? 0),
  predictions: Array.isArray(row.predictions)
    ? row.predictions as ReportAssessment["predictions"]
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
      p.name AS "patientName",
      m.id AS "medicineId",
      m.name AS "medicineName",
      COALESCE(a.risk_level, 'Low') AS "riskLevel",
      COALESCE(a.confidence, 0)::float AS confidence,
      a.created_at AS "createdAt",
      COUNT(aa.id)::int AS "adrCount",
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
    WHERE a.doctor_id = $1
    GROUP BY
      a.id,
      p.id,
      p.name,
      m.id,
      m.name,
      a.risk_level,
      a.confidence,
      a.created_at
    ORDER BY a.created_at DESC
    LIMIT 100
    `,
    [doctorId],
  );

  return result.rows.map(mapAssessmentRow);
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
        COALESCE(a.risk_level, 'Low') AS "riskLevel",
        COALESCE(a.confidence, 0)::float AS confidence,
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
