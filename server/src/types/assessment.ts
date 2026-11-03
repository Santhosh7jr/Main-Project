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
  | "previous_reaction"
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

  checkAvailability?: Record<
    string,
    "complete" | "unavailable" | "not_applicable"
  >;

  missingInformation?: string[];
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

  habitForming: boolean | null;

  uses: string[];
}


export interface AssessmentPrediction {
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

  topScores?: {
    adr: string;

    score: number;
  }[];
  error?: string;
}


export type RiskLevel =
  | "Low"
  | "Moderate"
  | "High"
  | "Unavailable";


export interface AssessmentResponse {
  assessmentId: number | null;

  createdAt: string | null;

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

    previousMedications?: {
      id: number;
      medicineId: number;
      medicineName: string;
      dosage: string | null;
      frequency: string | null;
      treatmentStatus: string;
      discontinuationReason: string | null;
    }[];

    adverseReactions?: {
      id: number;
      suspectedMedicine: string;
      reaction: string;
      severity: string;
      verificationStatus: string;
    }[];

    measurements?: {
      id: number;
      measurementName: string;
      value: number | null;
      valueText: string | null;
      unit: string | null;
      measuredAt: string;
    }[];

    currentComplaints?: string[];
  };

  medicine: AssessmentMedicine;

  documentedSideEffects: string[];
  knownSideEffects: {
    source: "medicine_dataset";
    items: string[];
  };

  prediction: AssessmentPrediction;

  predictions: {
    adr: string;

    score: number;

    probability: number | null;
  }[];

  patientSafety: PatientSafetyResult;

  riskLevel: RiskLevel;

  confidence: number | null;

  patientPersonalized: false;
  doctorDecision?: "prescribed" | "not_prescribed" | "deferred" | null;
  disclaimer: string;
}