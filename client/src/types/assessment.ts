export interface AssessmentPatient {
  id: number;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  conditions: string[];
  allergies: string[];
  medications: string[];
}

export interface Medicine {
  id: number;
  name: string;
  genericName: string | null;
  therapeuticClass: string | null;
  actionClass: string | null;
  chemicalClass: string | null;
  habitForming: boolean;
  uses: string[];
  sideEffects: string[];
}

export interface PredictedADR {
  adr: string;
  score: number;
}

export interface AssessmentResult {
  medicine: Medicine;
  documentedSideEffects: string[];
  predictedADRs: PredictedADR[];
  threshold: number;
}

export interface AlternativeMedicine {
  medicine: Medicine;
  similarity: number;
  reason: string;
}