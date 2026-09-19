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
  reason: string;
}

export interface FlaskAlternativesResponse {
  success: boolean;
  data?: AlternativeResult[];
  message?: string;
  error?: string;
}