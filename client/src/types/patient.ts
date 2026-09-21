export interface PatientMedication {
  id: number;

  medicineId: number;

  medicineName: string;

  dosage: string | null;

  frequency: string | null;

  startDate: string | null;

  endDate: string | null;
}

export interface PatientAssessmentHistory {
  id: number;
  createdAt: string;
  patientName: string;
  patientAge: number;
  patientGender: "Male" | "Female" | "Other";
  patientConditions: string[];
  patientAllergies: string[];

  medicineId: number;
  medicineName: string;
  genericName: string | null;
  therapeuticClass: string | null;
  actionClass: string | null;
  chemicalClass: string | null;
  habitForming: boolean;

  riskLevel: "Low" | "Moderate" | "High";
  confidence: number;

  predictions: {
    adr: string;
    score: number | null;
    probability: number | null;
  }[];
}

export interface Patient {
  id: number;

  name: string;

  age: number;

  gender:
    | "Male"
    | "Female"
    | "Other";

  phone: string | null;

  email: string | null;

  bloodGroup: string | null;

  conditions: string[];

  allergies: string[];

  medications: PatientMedication[];

  assessmentHistory: PatientAssessmentHistory[];

  createdAt: string;
}
