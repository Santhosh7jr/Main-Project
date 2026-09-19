import api from "./api";


// ======================================================
// ADR PREDICTION
// ======================================================

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


// ======================================================
// MEDICINE
// ======================================================

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
// RUN ASSESSMENT
// ======================================================

export const runAssessment =
  async (
    patientId: number,

    medicineId: number,
  ): Promise<AssessmentResponse> => {

    const response =
      await api.post<
        ApiResponse<AssessmentResponse>
      >(
        "/assessments",
        {
          patientId,

          medicineId,
        },
      );


    return response.data.data;
  };