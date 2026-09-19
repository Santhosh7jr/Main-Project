export interface Patient {
  id: number;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string | null;
  email: string | null;
  bloodGroup: string | null;
  conditions: string[];
  allergies: string[];
  medications: PatientMedication[];
  createdAt: string;
}

export interface PatientMedication {
  id: number;
  medicineId: number;
  medicineName: string;
  dosage: string | null;
  frequency: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface CreatePatientRequest {
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone?: string;
  email?: string;
  bloodGroup?: string;
  conditions?: string[];
  allergies?: string[];
}