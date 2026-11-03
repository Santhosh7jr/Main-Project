import api from "./api";

export interface MedicineRecommendation {
  medicine: {
    id: number;
    name: string;
    genericName: string | null;
  };
  similarityPercent: number;
  matchedUses: string[];
  knownSideEffectMatches: string[];
}

export interface MedicineRecommendations {
  recommendations: MedicineRecommendation[];
  totalCandidates: number;
  analyzedCandidates: number;
  rankingMethod: "ai" | "database";
  notice: string | null;
  commonSymptoms: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getMedicineRecommendations = async (
  patientId: number,
  problems: string[],
  sideEffects: string[],
): Promise<MedicineRecommendations> => {
  const response = await api.post<ApiResponse<MedicineRecommendations>>(
    "/assessments/recommendations",
    { patientId, problems, sideEffects },
  );

  if (!response.data.success) {
    throw new Error(response.data.message ?? "Unable to generate medicine matches.");
  }

  return response.data.data;
};
