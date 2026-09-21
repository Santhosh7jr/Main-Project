import api from "./api";
import type { Medicine } from "../types/medicine";


// ======================================================
// ADR PREDICTION
// ======================================================

export interface AssessmentPrediction {

  medicineText: string;

  predictedADRs: {
    adr: string;

    score: number;
    likelihood: "Low" | "Moderate" | "High";
  }[];

  threshold: number;

  topScores?: {
    adr: string;

    score: number;
  }[];
}


// ======================================================
// MEDICINE
// ======================================================

export type AssessmentMedicine = Medicine;


// ======================================================
// PATIENT SAFETY
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

export type RiskLevel =
  | "Low"
  | "Moderate"
  | "High";


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


  medicine:
    AssessmentMedicine;


  documentedSideEffects:
    string[];


  prediction:
    AssessmentPrediction;


  predictions: {

    adr: string;

    score: number;

    probability: number | null;
  }[];


  patientSafety:
    PatientSafetyResult;


  riskLevel:
    RiskLevel;


  confidence:
    number;
}


// ======================================================
// API WRAPPER
// ======================================================

interface ApiResponse<T> {

  success: boolean;

  data: T;

  message?: string;
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
): Promise<AssessmentResponse> => {
  const response =
    await api.post<ApiResponse<AssessmentResponse>>(
      "/assessments/preview",
      {
        patientId,
        medicineId,
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
): Promise<AssessmentResponse> => {
  const response =
    await api.post<ApiResponse<AssessmentResponse>>(
      "/assessments",
      {
        patientId,
        medicineId,
      },
    );

  return response.data.data;
};
