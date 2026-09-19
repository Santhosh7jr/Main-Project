import api from "./api.js";

import type {
  Medicine,
  MedicineComparison,
} from "../types/medicine.js";

// ============================================================
// API response types
// ============================================================

interface MedicineResponse {
  success: boolean;
  data: Medicine;
  message?: string;
}

interface MedicineSearchResponse {
  success: boolean;
  data: Medicine[];
  message?: string;
}

interface MedicineComparisonResponse {
  success: boolean;
  data: MedicineComparison;
  message?: string;
}

// ============================================================
// Search
// ============================================================

export const searchMedicines = async (
  search: string
): Promise<Medicine[]> => {
  const response =
    await api.get<MedicineSearchResponse>(
      "/medicines/search",
      {
        params: {
          search,
        },
      }
    );

  if (!response.data.success) {
    throw new Error(
      response.data.message ||
        "Failed to search medicines."
    );
  }

  return response.data.data;
};

// ============================================================
// Get medicine
// ============================================================

export const getMedicineById = async (
  medicineId: number
): Promise<Medicine> => {
  const response =
    await api.get<MedicineResponse>(
      `/medicines/${medicineId}`
    );

  if (!response.data.success) {
    throw new Error(
      response.data.message ||
        "Failed to get medicine."
    );
  }

  return response.data.data;
};

// ============================================================
// Compare medicines
// ============================================================

export const compareMedicines = async (
  medicine1Id: number,
  medicine2Id: number
): Promise<MedicineComparison> => {
  const response =
    await api.post<MedicineComparisonResponse>(
      "/medicines/compare",
      {
        medicine1Id,
        medicine2Id,
      }
    );

  if (!response.data.success) {
    throw new Error(
      response.data.message ||
        "Failed to compare medicines."
    );
  }

  // IMPORTANT:
  // Return data, not the complete Axios response.
  return response.data.data;
};