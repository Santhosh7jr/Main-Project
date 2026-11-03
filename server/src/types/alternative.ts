export interface AlternativeMedicineInput {
  id: number;
  name: string;
  genericName: string | null;
  therapeuticClass: string | null;
  actionClass: string | null;
  chemicalClass: string | null;
  habitForming: boolean | null;
  uses: string[];
  sideEffects: string[];
}

export interface AlternativeResult {
  medicine: AlternativeMedicineInput;
  similarity: number;
  matchLevel?: "Strong match" | "Good match" | "Moderate match" | "Possible match";
  reason: string;
  patientWarnings?: string[];
  previousReactionMatches?: string[];
  eligibilityStatus?: "review_required";
}

export interface ExcludedAlternative {
  medicineName: string;
  reasons: string[];
}

export interface FlaskAlternativesResponse {
  success: boolean;
  data?: AlternativeResult[];
  message?: string;
  error?: string;
}