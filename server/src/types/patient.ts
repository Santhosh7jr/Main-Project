export type PatientGender = "Male" | "Female" | "Other";
export type HistorySeverity = "mild" | "moderate" | "severe" | "unknown";
export type VerificationStatus =
  | "unverified"
  | "patient_reported"
  | "clinician_verified";
export type MedicationStatus =
  | "current"
  | "completed"
  | "discontinued"
  | "unknown";

export interface PatientConditionInput {
  conditionName: string;
  diagnosisDate?: string | null;
  status?: "current" | "resolved" | "unknown";
  clinicalNotes?: string | null;
}

export interface PatientAllergyInput {
  allergyName: string;
  reaction?: string | null;
  severity?: HistorySeverity;
  verificationStatus?: VerificationStatus;
}

export interface PatientMedicationInput {
  medicineId: number;
  dosage?: string | null;
  frequency?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  treatmentStatus?: MedicationStatus;
  treatmentDuration?: string | null;
  discontinuationDate?: string | null;
  discontinuationReason?: string | null;
  adverseReaction?: boolean | null;
}

export interface PatientAdverseReactionInput {
  medicineId?: number | null;
  suspectedMedicine: string;
  reaction: string;
  severity?: HistorySeverity;
  startedAt?: string | null;
  duration?: string | null;
  medicationStopped?: boolean | null;
  symptomsResolvedAfterStopping?: boolean | null;
  symptomsReturnedAfterRestarting?: boolean | null;
  treatmentReceived?: string | null;
  outcome?: string | null;
  clinicalNotes?: string | null;
  reporterType?: "patient_reported" | "caregiver_reported" | "clinician_reported";
  verificationStatus?: VerificationStatus;
}

export interface PatientMeasurementInput {
  measurementName: string;
  value?: number | null;
  valueText?: string | null;
  unit?: string | null;
  systolicValue?: number | null;
  diastolicValue?: number | null;
  measuredAt?: string;
  clinicalNotes?: string | null;
}

export interface CreatePatientRequest {
  name: string;
  age: number;
  gender: PatientGender;
  phone?: string | null;
  email?: string | null;
  bloodGroup?: string | null;
  conditions?: string[];
  allergies?: string[];
}

export interface UpdatePatientRequest {
  name: string;
  age: number;
  gender: PatientGender;
  phone?: string | null;
  email?: string | null;
  bloodGroup?: string | null;
}
