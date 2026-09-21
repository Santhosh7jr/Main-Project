export type RiskLevel =
  | "Low"
  | "Moderate"
  | "High";

export interface ReportPrediction {
  adr: string;
  score: number | null;
  probability: number | null;
}

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
  predictions?: ReportPrediction[];
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
