import api from "./api";

export interface AlternativeMedicine {
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
  medicine: AlternativeMedicine;
  similarity: number;
  reason: string;
  matchLevel?: string;
  patientWarnings?: string[];
  previousReactionMatches?: string[];
  eligibilityStatus?: "review_required";
}

export interface AlternativesResponse {
  medicine: AlternativeMedicine;
  alternatives: AlternativeResult[];
  excludedCandidates?: {
    medicineName: string;
    reasons: string[];
  }[];
  screeningLimitations?: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getAlternatives = async (
  medicineId: number,
  patientId?: number,
): Promise<AlternativesResponse> => {
  const response = await api.post<
    ApiResponse<AlternativesResponse>
  >("/alternatives", {
    medicineId,
    patientId,
  });

  return response.data.data;
};