export interface AssessmentPatient {
  id: number;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  conditions: string[];
  allergies: string[];
  medications: string[];
  previousMedications?: {
    medicineId: number;
    medicineName: string;
    treatmentStatus: string;
    discontinuationReason: string | null;
  }[];
  adverseReactions?: {
    suspectedMedicine: string;
    reaction: string;
    severity: string;
    verificationStatus: string;
  }[];
  measurements?: {
    measurementName: string;
    value: number | null;
    valueText: string | null;
    unit: string | null;
  }[];
  currentComplaints?: string[];
}

// Use the single shared Medicine type used by medicineService.
// Keeping a second Medicine interface here caused incompatible
// boolean vs boolean|null types across the assessment UI.
export type { Medicine } from "./medicine";

export interface PredictedADR {
  adr: string;
  score: number;
}

export interface AssessmentResult {
  medicine: import("./medicine").Medicine;
  documentedSideEffects: string[];
  knownSideEffects: {
    source: "medicine_dataset";
    items: string[];
  };
  prediction: {
    available: boolean;
    source: "machine_learning_model";
    scoreType: "model_score";
    predictedADRs: PredictedADR[];
    threshold: number | null;
    modelType?: string;
    error?: string;
  };
  patientPersonalized: false;
}

export interface AlternativeMedicine {
  medicine: import("./medicine").Medicine;
  similarity: number;
  reason: string;
}
