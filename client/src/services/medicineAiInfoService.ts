import api from "./api";

export interface AIMedicineDetails {
  description: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getAIMedicineDetails = async (
  medicineId: number,
): Promise<AIMedicineDetails> => {
  const response = await api.post<ApiResponse<AIMedicineDetails>>(
    `/medicines/${medicineId}/ai-details`,
  );
  if (!response.data.success) {
    throw new Error(response.data.message ?? "Could not load AI medicine details.");
  }
  return response.data.data;
};
