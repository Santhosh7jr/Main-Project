import type { Response } from "express";

import {
  evaluateAssessment,
  saveAssessment,
  recordAssessmentOutcome,
} from "../services/assessmentService.js";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const parseIds = (req: AuthenticatedRequest) => {
  const patientId = Number(req.body?.patientId);
  const medicineId = Number(req.body?.medicineId);

  if (!Number.isInteger(patientId) || patientId <= 0) {
    throw new Error("A valid patientId is required");
  }

  if (!Number.isInteger(medicineId) || medicineId <= 0) {
    throw new Error("A valid medicineId is required");
  }

  return { patientId, medicineId };
};

const parseContext = (req: AuthenticatedRequest) => {
  const parseList = (key: string) => {
    const value = req.body?.[key];
    if (value === undefined) return [];
    if (
      !Array.isArray(value) ||
      value.length > 30 ||
      value.some((entry) => typeof entry !== "string" || entry.length > 2000)
    ) {
      throw new Error(`A valid ${key} list is required`);
    }
    return value.map((entry: string) => entry.trim()).filter(Boolean);
  };
  return {
    currentComplaints: parseList("currentComplaints"),
    newlyReportedReactions: parseList("newlyReportedReactions"),
  };
};

const parseMedicationDetails = (req: AuthenticatedRequest) => {
  const dosage = String(req.body?.dosage ?? "").trim();
  const frequency = String(req.body?.frequency ?? "").trim();
  const endDate = String(req.body?.endDate ?? "").trim();

  if (!dosage || dosage.length > 100) {
    throw new Error("A valid dosage is required");
  }

  if (!frequency || frequency.length > 100) {
    throw new Error("A valid frequency is required");
  }

  if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new Error("A valid end date is required");
  }

  if (endDate) {
    const parsedEndDate = new Date(`${endDate}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedEndDate.getTime()) ||
      parsedEndDate.toISOString().slice(0, 10) !== endDate
    ) {
      throw new Error("A valid end date is required");
    }
  }

  return { dosage, frequency, endDate: endDate || null };
};

const parseDoctorDecision = (req: AuthenticatedRequest) => {
  const value = req.body?.doctorDecision ?? "prescribed";
  if (
    typeof value !== "string" ||
    !["prescribed", "not_prescribed", "deferred"].includes(value)
  ) {
    throw new Error("A valid doctorDecision is required");
  }
  return value as "prescribed" | "not_prescribed" | "deferred";
};

const parseAlternativeMedicineIds = (req: AuthenticatedRequest) => {
  const value = req.body?.alternativeMedicineIds ?? [];
  if (
    !Array.isArray(value) ||
    value.length > 30 ||
    value.some((id) => !Number.isInteger(id) || id <= 0)
  ) {
    throw new Error("A valid alternativeMedicineIds list is required");
  }
  return [...new Set(value as number[])];
};

const handleAssessmentError = (res: Response, error: unknown) => {
  console.error("Assessment error:", error);

  const message = error instanceof Error ? error.message : "Assessment failed";

  if (message === "Patient not found" || message === "Medicine not found") {
    return res.status(404).json({
      success: false,
      message,
    });
  }

  if (message.startsWith("A valid ")) {
    return res.status(400).json({
      success: false,
      message,
    });
  }

  if (
    message.includes("ML service") ||
    message.includes("Invalid response from ML service")
  ) {
    return res.status(503).json({
      success: false,
      message:
        "The ML service is currently unavailable. Please start the Flask API and try again.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Failed to process assessment",
  });
};

/**
 * PREVIEW ONLY
 * POST /api/assessments/preview
 *
 * This runs the AI/safety analysis but DOES NOT create
 * an assessments row.
 */
export const previewAssessment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const doctorId = req.doctorId;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { patientId, medicineId } = parseIds(req);
    const context = parseContext(req);

    const result = await evaluateAssessment({
      doctorId,
      patientId,
      medicineId,
      ...context,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleAssessmentError(res, error);
  }
};

/**
 * FINALIZE / SAVE
 * POST /api/assessments
 *
 * This is the ONLY endpoint that creates an assessment
 * history record.
 */
export const createAssessment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const doctorId = req.doctorId;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { patientId, medicineId } = parseIds(req);
    const context = parseContext(req);
    const doctorDecision = parseDoctorDecision(req);
    const alternativeMedicineIds = parseAlternativeMedicineIds(req);
    const medicationDetails = doctorDecision === "prescribed"
      ? parseMedicationDetails(req)
      : { dosage: "", frequency: "", endDate: null };

    const result = await saveAssessment({
      doctorId,
      patientId,
      medicineId,
      ...medicationDetails,
      ...context,
      doctorDecision,
      alternativeMedicineIds,
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleAssessmentError(res, error);
  }
};

export const updateAssessmentOutcome = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.doctorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const assessmentId = Number(req.params.id);
    const outcomeValue = req.body?.actualOutcome;
    const actualOutcome =
      typeof outcomeValue === "string" ? outcomeValue.trim() : "";
    if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid assessment ID",
      });
    }
    if (!actualOutcome || actualOutcome.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "A valid actualOutcome is required",
      });
    }
    const result = await recordAssessmentOutcome(
      req.doctorId,
      assessmentId,
      actualOutcome,
    );
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Assessment outcome update error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save assessment outcome",
    });
  }
};
