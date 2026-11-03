import type {
  Response,
} from "express";

import type {
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";

import {
  listAssessmentReports,
  readReportSummary,
  recordAlternativeDecision,
} from "../services/reportService.js";

const getDoctorId = (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!req.doctorId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return null;
  }

  return req.doctorId;
};

export const getReportSummary = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const doctorId = getDoctorId(req, res);

    if (!doctorId) {
      return;
    }

    const summary =
      await readReportSummary(doctorId);

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Report summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load report summary",
    });
  }
};

export const getAssessmentReports = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const doctorId = getDoctorId(req, res);

    if (!doctorId) {
      return;
    }

    const reports =
      await listAssessmentReports(doctorId);

    return res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Assessment report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load assessment reports",
    });
  }
};

export const updateAlternativeDecision = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const doctorId = getDoctorId(req, res);
    if (!doctorId) return;
    const assessmentId = Number(req.params.assessmentId);
    const medicineId = Number(req.params.medicineId);
    const decision = req.body?.decision;
    if (
      !Number.isInteger(assessmentId) ||
      assessmentId <= 0 ||
      !Number.isInteger(medicineId) ||
      medicineId <= 0
    ) {
      return res.status(400).json({ success: false, message: "Invalid assessment or medicine ID" });
    }
    if (
      typeof decision !== "string" ||
      !["selected", "rejected", "deferred"].includes(decision)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid alternative decision is required",
      });
    }
    const result = await recordAlternativeDecision(
      doctorId,
      assessmentId,
      medicineId,
      decision as "selected" | "rejected" | "deferred",
    );
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Assessment alternative not found",
      });
    }
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Alternative decision update error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save alternative decision",
    });
  }
};
