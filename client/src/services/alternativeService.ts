import api from "./api";

export interface AlternativeMedicine {
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
  medicine: AlternativeMedicine;
  similarity: number;
  reason: string;
  matchLevel?: string;
}

export interface AlternativesResponse {
  medicine: AlternativeMedicine;
  alternatives: AlternativeResult[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getAlternatives = async (
  medicineId: number
): Promise<AlternativesResponse> => {
  const response = await api.post<
    ApiResponse<AlternativesResponse>
  >("/alternatives", {
    medicineId,
  });

  return response.data.data;
};