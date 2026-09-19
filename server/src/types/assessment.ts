// ======================================================
// PATIENT SAFETY TYPES
// ======================================================

export type SafetySeverity =
  | "critical"
  | "warning"
  | "info";

export type SafetyCheckType =
  | "allergy"
  | "current_medication"
  | "condition"
  | "age"
  | "general";

export interface PatientSafetyAlert {
  type: SafetyCheckType;
  severity: SafetySeverity;
  title: string;
  message: string;
  matchedValue?: string;
  evidence?: string;
}

export interface PatientSafetyResult {
  hasAlerts: boolean;

  alertCount: number;

  criticalCount: number;

  warningCount: number;

  infoCount: number;

  alerts: PatientSafetyAlert[];

  summary: {
    allergyConflict: boolean;

    currentMedicationConflict: boolean;

    conditionReviewRequired: boolean;

    ageReviewRequired: boolean;
  };
}


// ======================================================
// EXISTING ASSESSMENT TYPES
// ======================================================

export interface AssessmentPatient {
  id: number;

  name: string;

  age: number;

  gender:
    | "Male"
    | "Female"
    | "Other";

  conditions: string[];

  allergies: string[];

  medications: string[];
}


export interface AssessmentMedicine {
  id: number;

  name: string;

  genericName: string | null;

  therapeuticClass: string | null;

  actionClass: string | null;

  chemicalClass: string | null;

  habitForming: boolean;

  uses: string[];
}


export interface AssessmentPrediction {
  medicineText: string;

  predictedADRs: {
    adr: string;

    score: number;
  }[];

  threshold: number;

  topScores?: {
    adr: string;

    score: number;
  }[];
}


export type RiskLevel =
  | "Low"
  | "Moderate"
  | "High";


export interface AssessmentResponse {
  assessmentId: number;

  createdAt: string;

  patient: {
    id: number;

    name: string;

    age: number;

    gender:
      | "Male"
      | "Female"
      | "Other";

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

  medicine: AssessmentMedicine;

  documentedSideEffects: string[];

  prediction: AssessmentPrediction;

  predictions: {
    adr: string;

    score: number;

    probability: number | null;
  }[];

  patientSafety: PatientSafetyResult;

  riskLevel: RiskLevel;

  confidence: number;
}