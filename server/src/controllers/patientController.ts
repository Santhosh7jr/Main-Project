import type {
  Response,
} from "express";

import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  addPatientCondition,
  addPatientAllergy,
  addPatientMedication,
  addPatientReaction,
  addPatientMeasurement,
  addPatientClinicalNote,
} from "../services/patientService.js";

import type {
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";
import type {
  PatientAdverseReactionInput,
  PatientAllergyInput,
  PatientConditionInput,
  PatientMeasurementInput,
  PatientMedicationInput,
  UpdatePatientRequest,
} from "../types/patient.js";

type PatientOperation = (
  doctorId: number,
  patientId: number,
  body: Record<string, unknown>,
) => Promise<unknown>;

const runPatientOperation = async (
  req: AuthenticatedRequest,
  res: Response,
  operation: PatientOperation,
) => {
  const doctorId = req.doctorId;
  const patientId = Number(req.params.id);
  if (!doctorId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }
  if (!Number.isInteger(patientId) || patientId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }

  try {
    const data = await operation(
      doctorId,
      patientId,
      req.body as Record<string, unknown>,
    );
    if (data === null) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Patient history operation error:", error);
    if (error instanceof Error && error.message === "Patient not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (
      error instanceof Error &&
      (error.message.startsWith("A valid ") ||
        error.message.startsWith("Invalid ") ||
        error.message.startsWith("Enter "))
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to update patient history",
    });
  }
};

const requiredText = (body: Record<string, unknown>, key: string, limit: number) => {
  const value = body[key];
  if (typeof value !== "string" || !value.trim() || value.length > limit) {
    throw new Error(`A valid ${key} is required`);
  }
  return value.trim();
};

const optionalText = (body: Record<string, unknown>, key: string) => {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error(`Invalid ${key}`);
  }
  return value.trim() || null;
};

const optionalBoolean = (body: Record<string, unknown>, key: string) => {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "boolean") {
    throw new Error(`Invalid ${key}`);
  }
  return value;
};

const optionalDate = (body: Record<string, unknown>, key: string) => {
  const value = optionalText(body, key);
  if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid ${key}`);
  }
  return value;
};

const enumValue = <T extends string>(
  body: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T => {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`Invalid ${key}`);
  }
  return value as T;
};

const severityValues = ["mild", "moderate", "severe", "unknown"] as const;
const verificationValues = [
  "unverified",
  "patient_reported",
  "clinician_verified",
] as const;


// ======================================================
// GET ALL PATIENTS
// GET /api/patients
// ======================================================

export const getPatients =
  async (
    req: AuthenticatedRequest,
    res: Response,
  ) => {
    try {
      const doctorId =
        req.doctorId;

      if (!doctorId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const patients =
        await getAllPatients(
          doctorId,
        );

      return res.json({
        success: true,
        data: patients,
      });
    } catch (error) {
      console.error(
        "Get patients error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch patients",
      });
    }
  };


// ======================================================
// GET PATIENT
// GET /api/patients/:id
// ======================================================

export const getPatient =
  async (
    req: AuthenticatedRequest,
    res: Response,
  ) => {
    try {
      const doctorId =
        req.doctorId;

      if (!doctorId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const id =
        Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid patient ID",
        });
      }

      const patient =
        await getPatientById(
          id,
          doctorId,
        );

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      return res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      console.error(
        "Get patient error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch patient",
      });
    }
  };


// ======================================================
// CREATE PATIENT
// POST /api/patients
// ======================================================

export const addPatient =
  async (
    req: AuthenticatedRequest,
    res: Response,
  ) => {
    try {
      const doctorId =
        req.doctorId;

      if (!doctorId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const patient =
        await createPatient(
          doctorId,
          req.body,
        );

      return res.status(201).json({
        success: true,
        data: patient,
      });
    } catch (error) {
      console.error(
        "Create patient error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create patient",
      });
    }
  };

export const editPatient = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const body = req.body as Record<string, unknown>;
  try {
    const name = requiredText(body, "name", 150);
    const age = Number(body.age);
    const gender = body.gender;
    if (!Number.isInteger(age) || age < 0 || age > 150) {
      throw new Error("A valid age is required");
    }
    if (!["Male", "Female", "Other"].includes(String(gender))) {
      throw new Error("A valid gender is required");
    }
    return await runPatientOperation(req, res, (doctorId, patientId) =>
      updatePatient(doctorId, patientId, {
        name,
        age,
        gender: gender as UpdatePatientRequest["gender"],
        phone: optionalText(body, "phone"),
        email: optionalText(body, "email"),
        bloodGroup: optionalText(body, "bloodGroup"),
      }),
    );
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Invalid patient data",
    });
  }
};

export const addCondition = (
  req: AuthenticatedRequest,
  res: Response,
) => runPatientOperation(req, res, (doctorId, patientId, body) => {
  const data: PatientConditionInput = {
    conditionName: requiredText(body, "conditionName", 200),
    diagnosisDate: optionalDate(body, "diagnosisDate"),
    status: enumValue(body, "status", ["current", "resolved", "unknown"] as const, "current"),
    clinicalNotes: optionalText(body, "clinicalNotes"),
  };
  return addPatientCondition(doctorId, patientId, data);
});

export const addAllergy = (
  req: AuthenticatedRequest,
  res: Response,
) => runPatientOperation(req, res, (doctorId, patientId, body) => {
  const data: PatientAllergyInput = {
    allergyName: requiredText(body, "allergyName", 200),
    reaction: optionalText(body, "reaction"),
    severity: enumValue(body, "severity", severityValues, "unknown"),
    verificationStatus: enumValue(body, "verificationStatus", verificationValues, "patient_reported"),
  };
  return addPatientAllergy(doctorId, patientId, data);
});

export const addMedication = (
  req: AuthenticatedRequest,
  res: Response,
) => runPatientOperation(req, res, (doctorId, patientId, body) => {
  const medicineId = Number(body.medicineId);
  if (!Number.isInteger(medicineId) || medicineId <= 0) {
    throw new Error("A valid medicineId is required");
  }
  const frequency = requiredText(body, "frequency", 200);
  const endDate = requiredText(body, "endDate", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new Error("Invalid endDate");
  }
  const data: PatientMedicationInput = {
    medicineId,
    dosage: optionalText(body, "dosage"),
    frequency,
    startDate: optionalDate(body, "startDate"),
    endDate,
    treatmentStatus: enumValue(body, "treatmentStatus", ["current", "completed", "discontinued", "unknown"] as const, "current"),
    treatmentDuration: optionalText(body, "treatmentDuration"),
    discontinuationDate: optionalDate(body, "discontinuationDate"),
    discontinuationReason: optionalText(body, "discontinuationReason"),
    adverseReaction: optionalBoolean(body, "adverseReaction"),
  };
  return addPatientMedication(doctorId, patientId, data);
});

export const addAdverseReaction = (
  req: AuthenticatedRequest,
  res: Response,
) => runPatientOperation(req, res, (doctorId, patientId, body) => {
  const medicineId = body.medicineId == null || body.medicineId === ""
    ? null
    : Number(body.medicineId);
  if (medicineId !== null && (!Number.isInteger(medicineId) || medicineId <= 0)) {
    throw new Error("Invalid medicineId");
  }
  const data: PatientAdverseReactionInput = {
    medicineId,
    suspectedMedicine: requiredText(body, "suspectedMedicine", 200),
    reaction: requiredText(body, "reaction", 2000),
    severity: enumValue(body, "severity", severityValues, "unknown"),
    startedAt: optionalDate(body, "startedAt"),
    duration: optionalText(body, "duration"),
    medicationStopped: optionalBoolean(body, "medicationStopped"),
    symptomsResolvedAfterStopping: optionalBoolean(body, "symptomsResolvedAfterStopping"),
    symptomsReturnedAfterRestarting: optionalBoolean(body, "symptomsReturnedAfterRestarting"),
    treatmentReceived: optionalText(body, "treatmentReceived"),
    outcome: optionalText(body, "outcome"),
    clinicalNotes: optionalText(body, "clinicalNotes"),
    reporterType: enumValue(body, "reporterType", ["patient_reported", "caregiver_reported", "clinician_reported"] as const, "patient_reported"),
    verificationStatus: enumValue(body, "verificationStatus", verificationValues, "unverified"),
  };
  return addPatientReaction(doctorId, patientId, data);
});

export const addMeasurement = (
  req: AuthenticatedRequest,
  res: Response,
) => runPatientOperation(req, res, (doctorId, patientId, body) => {
  const numeric = (key: string) => {
    const value = body[key];
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`Invalid ${key}`);
    return parsed;
  };
  const data: PatientMeasurementInput = {
    measurementName: requiredText(body, "measurementName", 100),
    value: numeric("value"),
    valueText: optionalText(body, "valueText"),
    unit: optionalText(body, "unit"),
    systolicValue: numeric("systolicValue"),
    diastolicValue: numeric("diastolicValue"),
    measuredAt: typeof body.measuredAt === "string" ? body.measuredAt : undefined,
    clinicalNotes: optionalText(body, "clinicalNotes"),
  };
  if (
    data.value === null && !data.valueText &&
    data.systolicValue === null && data.diastolicValue === null
  ) {
    throw new Error("Enter a measurement value");
  }
  return addPatientMeasurement(doctorId, patientId, data);
});

export const addClinicalNote = (
  req: AuthenticatedRequest,
  res: Response,
) => runPatientOperation(req, res, (doctorId, patientId, body) =>
  addPatientClinicalNote(
    doctorId,
    patientId,
    requiredText(body, "note", 10000),
  ),
);