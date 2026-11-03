export type RiskLevel = "Low" | "Moderate" | "High" | "Unavailable";

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
