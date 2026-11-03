export interface FlaskMedicine {
  name: string;
  genericName?: string | null;
  therapeuticClass?: string | null;
  actionClass?: string | null;
  chemicalClass?: string | null;
  habitForming?: boolean | null;
  uses?: string[];
}

export interface FlaskPredictRequest {
  medicine: FlaskMedicine;
}

export interface FlaskPredictedADR {
  adr: string;
  score: number;
}

export interface FlaskPredictionData {
  medicineText: string;
  source?: "machine_learning_model";
  predictedADRs: FlaskPredictedADR[];
  threshold: number;
  scoreType: "model_score";
  patientPersonalized: false;
  modelType?: string;
  trainingMetadata?: Record<string, unknown>;
  topScores?: FlaskPredictedADR[];
}

export interface FlaskPredictionResponse {
  success: boolean;
  data?: FlaskPredictionData;
  message?: string;
  error?: string;
}

export type FlaskSafetyCheckType =
  | "allergy"
  | "current_medication"
  | "previous_reaction"
  | "condition"
  | "age"
  | "general";

export interface FlaskSafetyAlert {
  type: FlaskSafetyCheckType;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  matchedValue?: string;
  evidence?: string;
}

export interface FlaskPatientSafetyData {
  hasAlerts: boolean;
  alertCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  alerts: FlaskSafetyAlert[];
  summary: {
    allergyConflict: boolean;
    currentMedicationConflict: boolean;
    conditionReviewRequired: boolean;
    ageReviewRequired: boolean;
  };
  checkAvailability?: Record<string, "complete" | "unavailable" | "not_applicable">;
  missingInformation?: string[];
}