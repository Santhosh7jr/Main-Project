import axios from "axios";
import api from "./api";

type AuthAction = "login" | "register";

const knownAuthMessages = new Set([
  "Doctor name is required",
  "Email is required",
  "Password must contain at least 6 characters",
  "Specialization is required",
  "Email and password are required",
]);

export const getAuthErrorMessage = (
  error: unknown,
  action: AuthAction,
): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.";
  }

  if (!error.response) {
    return "MedGuard could not connect to the server. Check your connection and try again.";
  }

  const status = error.response.status;
  const data: unknown = error.response.data;
  const responseMessage =
    typeof data === "object" && data !== null && "message" in data
      ? data.message
      : undefined;

  if (status === 401 && action === "login") {
    return "Email or password is incorrect. Check your details and try again.";
  }

  if (status === 409 && action === "register") {
    return typeof responseMessage === "string"
      ? responseMessage
      : "An account with this email already exists. Try logging in instead.";
  }

  if (status === 400 && typeof responseMessage === "string" && knownAuthMessages.has(responseMessage)) {
    return responseMessage;
  }

  if (status === 403) {
    return "You are not allowed to perform this action. Contact your administrator if you need help.";
  }

  if (status === 429) {
    return "Too many attempts. Wait a little while, then try again.";
  }

  if (status >= 500) {
    return action === "login"
      ? "Login is temporarily unavailable. Please try again shortly."
      : "Registration is temporarily unavailable. Please try again shortly.";
  }

  return action === "login"
    ? "We could not log you in. Check your details and try again."
    : "We could not create your account. Check the information and try again.";
};

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