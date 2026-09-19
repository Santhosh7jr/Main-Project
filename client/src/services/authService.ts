import api from "./api";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  specialization: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface Doctor {
  id: number;
  name: string;
  email: string;
  specialization: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  doctor: Doctor;
}

export const registerDoctor = async (
  data: RegisterData
): Promise<Doctor> => {
  const response = await api.post("/auth/register", data);

  return response.data.doctor;
};

export const loginDoctor = async (
  data: LoginData
): Promise<AuthResponse> => {
  const response = await api.post("/auth/login", data);

  return response.data;
};

export const getCurrentDoctor = async (): Promise<Doctor> => {
  const response = await api.get("/auth/me");

  return response.data.doctor;
};