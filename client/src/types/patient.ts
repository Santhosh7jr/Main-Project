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

export interface PatientCondition {
  id: number;
  conditionName: string;
  diagnosisDate: string | null;
  status: "current" | "resolved" | "unknown";
  clinicalNotes: string | null;
}

export interface PatientAllergy {
  id: number;
  allergyName: string;
  reaction: string | null;
  severity: HistorySeverity;
  verificationStatus: VerificationStatus;
}

export interface PatientMedication {
  id: number;

  medicineId: number;

  medicineName: string;

  dosage: string | null;

  frequency: string | null;

  startDate: string | null;

  endDate: string | null;

  treatmentStatus: MedicationStatus;

  treatmentDuration: string | null;

  discontinuationDate: string | null;

  discontinuationReason: string | null;

  adverseReaction: boolean | null;
}

export interface PatientAdverseReaction {
  id: number;
  medicineId: number | null;
  suspectedMedicine: string;
  reaction: string;
  severity: HistorySeverity;
  startedAt: string | null;
  duration: string | null;
  medicationStopped: boolean | null;
  symptomsResolvedAfterStopping: boolean | null;
  symptomsReturnedAfterRestarting: boolean | null;
  treatmentReceived: string | null;
  outcome: string | null;
  clinicalNotes: string | null;
  reporterType: "patient_reported" | "caregiver_reported" | "clinician_reported";
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export interface PatientMeasurement {
  id: number;
  measurementName: string;
  value: number | null;
  valueText: string | null;
  unit: string | null;
  systolicValue: number | null;
  diastolicValue: number | null;
  measuredAt: string;
  clinicalNotes: string | null;
}

export interface PatientComplaint {
  id: number;
  complaint: string;
  reportedAt: string;
  status: "active" | "resolved" | "unknown";
  clinicalNotes: string | null;
}

export interface PatientClinicalNote {
  id: number;
  note: string;
  createdAt: string;
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
  habitForming: boolean | null;

  riskLevel: "Low" | "Moderate" | "High" | "Unavailable";
  confidence: number | null;
  doctorDecision: "prescribed" | "not_prescribed" | "deferred" | null;
  actualOutcome: string | null;
  currentComplaints: string[];
  newlyReportedReactions: string[];
  patientContextSnapshot: Record<string, unknown>;
  patientSafetySnapshot: Record<string, unknown>;

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

  conditionRecords?: PatientCondition[];

  allergyDetails?: PatientAllergy[];

  medications: PatientMedication[];

  previousMedications?: PatientMedication[];

  adverseReactions?: PatientAdverseReaction[];

  measurements?: PatientMeasurement[];

  complaints?: PatientComplaint[];

  clinicalNotes?: PatientClinicalNote[];

  assessmentHistory: PatientAssessmentHistory[];

  createdAt: string;

  activeMedicationCount?: number;

  conditionCount?: number;

  latestAssessmentAt?: string | null;
}

export interface CreatePatientRequest {
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone?: string | null;
  email?: string | null;
  bloodGroup?: string | null;
  conditions?: string[];
  allergies?: string[];
}

export type UpdatePatientRequest = Omit<CreatePatientRequest, "conditions" | "allergies">;
