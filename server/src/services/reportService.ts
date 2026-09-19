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
  highRiskCases: number;
  moderateRiskCases: number;
  lowRiskCases: number;
  riskDistribution: RiskBucket[];
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
    riskResult,
    recentResult,
  ] = await Promise.all([
    pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM patients
      WHERE doctor_id = $1
      `,
      [doctorId],
    ),
    pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM assessments
      WHERE doctor_id = $1
      `,
      [doctorId],
    ),
    pool.query(
      `
      SELECT
        COALESCE(risk_level, 'Low') AS "riskLevel",
        COUNT(*)::int AS count
      FROM assessments
      WHERE doctor_id = $1
      GROUP BY COALESCE(risk_level, 'Low')
      `,
      [doctorId],
    ),
    pool.query(
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
        COUNT(aa.id)::int AS "adrCount"
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
      LIMIT 5
      `,
      [doctorId],
    ),
  ]);

  const totalPatients =
    toCount(patientResult.rows[0]?.count);

  const totalAssessments =
    toCount(assessmentResult.rows[0]?.count);

  const riskCounts =
    new Map<RiskLevel, number>([
      ["Low", 0],
      ["Moderate", 0],
      ["High", 0],
    ]);

  for (const row of riskResult.rows) {
    riskCounts.set(
      normalizeRiskLevel(row.riskLevel),
      toCount(row.count),
    );
  }

  const riskDistribution:
    RiskBucket[] = [
      "Low",
      "Moderate",
      "High",
    ].map((riskLevel) => ({
      riskLevel:
        riskLevel as RiskLevel,
      count:
        riskCounts.get(
          riskLevel as RiskLevel,
        ) ?? 0,
    }));

  return {
    totalPatients,
    totalAssessments,
    highRiskCases:
      riskCounts.get("High") ?? 0,
    moderateRiskCases:
      riskCounts.get("Moderate") ?? 0,
    lowRiskCases:
      riskCounts.get("Low") ?? 0,
    riskDistribution,
    recentAssessments:
      recentResult.rows.map(
        mapAssessmentRow,
      ),
  };
};
