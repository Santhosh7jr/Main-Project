import api from "./api";
import type { Patient } from "../types/patient";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getPatients = async (): Promise<Patient[]> => {
  const response =
    await api.get<ApiResponse<Patient[]>>(
      "/patients"
    );

  return response.data.data;
};

export const getPatientById = async (
  id: number
): Promise<Patient> => {
  const response =
    await api.get<ApiResponse<Patient>>(
      `/patients/${id}`
    );

  return response.data.data;
};

export const createPatient = async (
  patient: Omit<Patient, "id" | "createdAt">
): Promise<Patient> => {
  const response =
    await api.post<ApiResponse<Patient>>(
      "/patients",
      patient
    );

  return response.data.data;
};