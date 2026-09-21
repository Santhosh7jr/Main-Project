export interface AssessmentPatient {
  id: number;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  conditions: string[];
  allergies: string[];
  medications: string[];
}

// Use the single shared Medicine type used by medicineService.
// Keeping a second Medicine interface here caused incompatible
// boolean vs boolean|null types across the assessment UI.
export type { Medicine } from "./medicine";

export interface PredictedADR {
  adr: string;
  score: number;
  likelihood: "Low" | "Moderate" | "High";
}

export interface AssessmentResult {
  medicine: import("./medicine").Medicine;
  documentedSideEffects: string[];
  predictedADRs: PredictedADR[];
  threshold: number;
}

export interface AlternativeMedicine {
  medicine: import("./medicine").Medicine;
  similarity: number;
  reason: string;
}
