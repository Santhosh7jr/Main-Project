import api from "./api";
import type { Medicine } from "../types/medicine";

// ======================================================
// ADR PREDICTION
// ======================================================

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

// ======================================================
// MEDICINE
// ======================================================

export type AssessmentMedicine = Medicine;

// ======================================================
// PATIENT SAFETY
// ======================================================

export type SafetySeverity = "critical" | "warning" | "info";

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
// ALTERNATIVE
// ======================================================

export interface AssessmentAlternative {
  medicine: AssessmentMedicine;

  similarity: number;

  reason: string;
}

// ======================================================
// MODEL OUTPUT
// ======================================================

export type RiskLevel = "Low" | "Moderate" | "High";

// ======================================================
// COMPLETE ASSESSMENT
// ======================================================

export interface AssessmentResponse {
  /**
   * null while this is only a preview.
   * A number is returned after the doctor saves the medicine.
   */
  assessmentId: number | null;

  createdAt: string | null;

  patient: {
    id: number;

    name: string;

    age: number;

    gender: "Male" | "Female" | "Other";

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

  riskLevel: RiskLevel | "Unavailable";

  confidence: number | null;

  patientPersonalized: false;

  doctorDecision?: "prescribed" | "not_prescribed" | "deferred" | null;

  actualOutcome?: string | null;

  disclaimer: string;
}

// ======================================================
// API WRAPPER
// ======================================================

interface ApiResponse<T> {
  success: boolean;

  data: T;

  message?: string;
}

export interface MedicationDetails {
  dosage: string;
  frequency: string;
  endDate: string;
}

// ======================================================
// PREVIEW ASSESSMENT
// ======================================================
//
// Runs the AI/safety analysis only.
// It DOES NOT save anything to the database.
//
export const runAssessment = async (
  patientId: number,
  medicineId: number,
  currentComplaints: string[] = [],
  newlyReportedReactions: string[] = [],
): Promise<AssessmentResponse> => {
  const response = await api.post<ApiResponse<AssessmentResponse>>(
    "/assessments/preview",
    {
      patientId,
      medicineId,
      currentComplaints,
      newlyReportedReactions,
    },
  );

  return response.data.data;
};

// ======================================================
// SAVE SELECTED MEDICINE
// ======================================================
//
// Call this only after the doctor explicitly decides
// that this is the medicine to give the patient.
//
export const saveAssessment = async (
  patientId: number,
  medicineId: number,
  medicationDetails: MedicationDetails,
  currentComplaints: string[] = [],
  newlyReportedReactions: string[] = [],
  doctorDecision: "prescribed" | "not_prescribed" | "deferred" = "prescribed",
  alternativeMedicineIds: number[] = [],
): Promise<AssessmentResponse> => {
  const response = await api.post<ApiResponse<AssessmentResponse>>(
    "/assessments",
    {
      patientId,
      medicineId,
      ...medicationDetails,
      currentComplaints,
      newlyReportedReactions,
      doctorDecision,
      alternativeMedicineIds,
    },
  );

  return response.data.data;
};

export const saveAssessmentOutcome = async (
  assessmentId: number,
  actualOutcome: string,
): Promise<{ assessmentId: number; actualOutcome: string; actualOutcomeAt: string }> => {
  const response = await api.put<ApiResponse<{
    assessmentId: number;
    actualOutcome: string;
    actualOutcomeAt: string;
  }>>(`/assessments/${assessmentId}/outcome`, { actualOutcome });
  return response.data.data;
};
