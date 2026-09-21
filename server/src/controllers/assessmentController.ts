import type { Response } from "express";

import {
  evaluateAssessment,
  saveAssessment,
} from "../services/assessmentService.js";

import type {
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";

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

const handleAssessmentError = (
  res: Response,
  error: unknown,
) => {
  console.error("Assessment error:", error);

  const message =
    error instanceof Error
      ? error.message
      : "Assessment failed";

  if (
    message === "Patient not found" ||
    message === "Medicine not found"
  ) {
    return res.status(404).json({
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

    const result = await evaluateAssessment({
      doctorId,
      patientId,
      medicineId,
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

    const result = await saveAssessment({
      doctorId,
      patientId,
      medicineId,
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleAssessmentError(res, error);
  }
};
