import type {
  Response,
} from "express";

import type {
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";

import {
  listAssessmentReports,
  readReportSummary,
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
