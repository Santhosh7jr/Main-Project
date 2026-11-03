export interface RegisterDoctorInput {
  name: string;
  email: string;
  password: string;
  specialization: string;
}

export interface LoginDoctorInput {
  email: string;
  password: string;
}

export interface Doctor {
  id: number;
  name: string;
  email: string;
  specialization: string;
}

export interface JwtPayload {
  doctorId: number;
  email: string;
}