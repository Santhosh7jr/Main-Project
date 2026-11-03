import axios from "axios";

import type {
  Medicine,
  MedicineComparison,
} from "../types/medicine.js";

const FLASK_URL =
  process.env.FLASK_API_URL ||
  "http://127.0.0.1:5001";

interface FlaskComparisonResponse {
  success: boolean;
  data?: MedicineComparison;
  message?: string;
}

// ============================================================
// Compare medicines through Flask
// ============================================================

export const compareMedicinesWithFlask = async (
  medicine1: Medicine,
  medicine2: Medicine
): Promise<MedicineComparison> => {
  try {
    const response =
      await axios.post<FlaskComparisonResponse>(
        `${FLASK_URL}/api/medicine/compare`,
        {
          medicine1,
          medicine2,
        },
        {
          timeout: 15000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Flask comparison failed."
      );
    }

    if (!response.data.data) {
      throw new Error(
        "Flask returned no comparison data."
      );
    }

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Flask comparison error:",
        error.response?.data || error.message
      );

      throw new Error(
        error.response?.data?.message ||
          "Unable to connect to Flask comparison API."
      );
    }

    console.error(
      "Flask comparison error:",
      error
    );

    throw error instanceof Error
      ? error
      : new Error(
          "Unable to compare medicines."
        );
  }
};