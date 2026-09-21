import axios from "axios";

import { env } from "../config/env.js";


// ======================================================
// MEDICINE
// ======================================================

export interface FlaskMedicine {
  name: string;

  uses: string[];

  therapeuticClass?: string | null;

  actionClass?: string | null;

  chemicalClass?: string | null;

  habitForming?: boolean;

  genericName?: string | null;
}


// ======================================================
// PATIENT CONTEXT
// ======================================================

export interface FlaskPatientContext {
  age: number;

  gender: string;

  conditions: string[];

  allergies: string[];

  medications: string[];
}


// ======================================================
// ADR
// ======================================================

export interface FlaskADR {
  adr: string;
  score: number;
  likelihood?: "Low" | "Moderate" | "High";
}


export interface FlaskPredictionData {
  medicineText: string;

  predictedADRs: FlaskADR[];

  threshold: number;

  topScores: FlaskADR[];
}


export interface FlaskPredictionResponse {
  success: boolean;

  data: FlaskPredictionData;

  message?: string;
}


// ======================================================
// PATIENT SAFETY
// ======================================================

export type SafetySeverity =
  | "critical"
  | "warning"
  | "info";


export type SafetyCheckType =
  | "allergy"
  | "current_medication"
  | "condition"
  | "age"
  | "general";


export interface FlaskSafetyAlert {
  type: SafetyCheckType;

  severity: SafetySeverity;

  title: string;

  message: string;

  matchedValue?: string;

  evidence?: string;
}


export interface FlaskPatientSafetyData {
  hasAlerts: boolean;

  alertCount: number;

  criticalCount: number;

  warningCount: number;

  infoCount: number;

  alerts: FlaskSafetyAlert[];

  summary: {
    allergyConflict: boolean;

    currentMedicationConflict: boolean;

    conditionReviewRequired: boolean;

    ageReviewRequired: boolean;
  };
}


export interface FlaskPatientSafetyResponse {
  success: boolean;

  data: FlaskPatientSafetyData;

  message?: string;
}


// ======================================================
// ADR PREDICTION
// ======================================================

export const predictADR = async (
  medicine: FlaskMedicine,
): Promise<FlaskPredictionResponse> => {

  try {

    const response =
      await axios.post<FlaskPredictionResponse>(
        `${env.flaskUrl}/api/predict`,
        {
          medicine: {
            name:
              medicine.name,

            uses:
              medicine.uses ?? [],

            therapeuticClass:
              medicine.therapeuticClass ?? null,

            actionClass:
              medicine.actionClass ?? null,

            chemicalClass:
              medicine.chemicalClass ?? null,

            habitForming:
              medicine.habitForming ?? false,

            genericName:
              medicine.genericName ?? null,
          },
        },
        {
          timeout: 30000,
        },
      );


    if (
      !response.data ||
      response.data.success !== true ||
      !response.data.data
    ) {

      throw new Error(
        "Invalid response from Flask prediction API",
      );
    }


    return response.data;

  } catch (error) {

    if (
      axios.isAxiosError(error)
    ) {

      console.error(
        "Flask prediction request failed:",
        error.response?.data ??
          error.message,
      );

    } else {

      console.error(
        "Flask prediction error:",
        error,
      );
    }


    throw new Error(
      "Unable to get ADR prediction from ML service",
    );
  }
};


// ======================================================
// PATIENT SAFETY
// ======================================================

export const analyzePatientSafety =
  async (
    patient: FlaskPatientContext,

    medicine: FlaskMedicine,
  ): Promise<FlaskPatientSafetyResponse> => {

    try {

      const response =
        await axios.post<FlaskPatientSafetyResponse>(
          `${env.flaskUrl}/api/patient-safety`,
          {
            patient,

            medicine,
          },
          {
            timeout: 10000,
          },
        );


      if (
        !response.data ||
        response.data.success !== true ||
        !response.data.data
      ) {

        throw new Error(
          "Invalid response from Flask patient safety API",
        );
      }


      return response.data;

    } catch (error) {

      if (
        axios.isAxiosError(error)
      ) {

        console.error(
          "Flask patient safety request failed:",
          error.response?.data ??
            error.message,
        );

      } else {

        console.error(
          "Flask patient safety error:",
          error,
        );
      }


      throw new Error(
        "Unable to get patient safety analysis from ML service",
      );
    }
  };