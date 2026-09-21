export interface AlternativeMedicineInput {
  id: number;
  name: string;
  genericName: string | null;
  therapeuticClass: string | null;
  actionClass: string | null;
  chemicalClass: string | null;
  habitForming: boolean;
  uses: string[];
}

export interface AlternativeResult {
  medicine: AlternativeMedicineInput;
  similarity: number;
  matchStrength: "Strong match" | "Good match" | "Moderate match" | "Limited match";
  reason: string;
}

export interface FlaskAlternativesResponse {
  success: boolean;
  data?: AlternativeResult[];
  message?: string;
  error?: string;
}