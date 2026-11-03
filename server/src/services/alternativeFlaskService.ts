import axios from "axios";

import { env } from "../config/env.js";

import type {
  AlternativeMedicineInput,
  FlaskAlternativesResponse,
} from "../types/alternative.js";


export const findAlternatives = async (
  medicine: AlternativeMedicineInput,
  medicines: AlternativeMedicineInput[]
): Promise<FlaskAlternativesResponse> => {

  try {

    const response =
      await axios.post<FlaskAlternativesResponse>(
        `${env.flaskUrl}/api/alternatives`,
        {
          medicine,
          medicines,
        },
        {
          timeout: 30000,

          headers: {
            "Content-Type": "application/json",
          },
        }
      );

    return response.data;

  } catch (error) {

    if (axios.isAxiosError(error)) {

      console.error(
        "Flask alternatives request failed:",
        error.response?.data ||
          error.message
      );

      throw new Error(
        error.response?.data?.message ||
          "Unable to communicate with Flask alternatives API."
      );
    }

    console.error(
      "Unexpected Flask alternatives error:",
      error
    );

    throw new Error(
      "Unable to communicate with Flask alternatives API."
    );
  }
};