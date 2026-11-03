import api from "./api";
import type {
  CreatePatientRequest,
  Patient,
  PatientAdverseReaction,
  PatientAllergy,
  PatientCondition,
  PatientMeasurement,
  PatientMedication,
  UpdatePatientRequest,
} from "../types/patient";

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
  patient: CreatePatientRequest
): Promise<Patient> => {
  const response =
    await api.post<ApiResponse<Patient>>(
      "/patients",
      patient
    );

  return response.data.data;
};

const updatePatientHistory = async (
  patientId: number,
  endpoint: string,
  data: unknown,
): Promise<Patient> => {
  const response = await api.post<ApiResponse<Patient>>(
    `/patients/${patientId}/${endpoint}`,
    data,
  );
  return response.data.data;
};

export const updatePatient = async (
  patientId: number,
  patient: UpdatePatientRequest,
): Promise<Patient> => {
  const response = await api.put<ApiResponse<Patient>>(
    `/patients/${patientId}`,
    patient,
  );
  return response.data.data;
};

export const addPatientCondition = (
  patientId: number,
  condition: Omit<PatientCondition, "id">,
) => updatePatientHistory(patientId, "conditions", condition);

export const addPatientAllergy = (
  patientId: number,
  allergy: Omit<PatientAllergy, "id">,
) => updatePatientHistory(patientId, "allergies", allergy);

export const addPatientMedication = (
  patientId: number,
  medication: Omit<PatientMedication, "id" | "medicineName">,
) => updatePatientHistory(patientId, "medications", medication);

export const addPatientAdverseReaction = (
  patientId: number,
  reaction: Omit<PatientAdverseReaction, "id" | "createdAt">,
) => updatePatientHistory(patientId, "adverse-reactions", reaction);

export const addPatientMeasurement = (
  patientId: number,
  measurement: Omit<PatientMeasurement, "id">,
) => updatePatientHistory(patientId, "measurements", measurement);

export const addPatientClinicalNote = (
  patientId: number,
  note: string,
) => updatePatientHistory(patientId, "clinical-notes", { note });