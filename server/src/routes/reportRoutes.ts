import { Router } from "express";

import {
  requireAuth,
} from "../middleware/authMiddleware.js";

import {
  getAssessmentReports,
  getReportSummary,
  updateAlternativeDecision,
} from "../controllers/reportController.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/summary",
  getReportSummary,
);

router.get(
  "/assessments",
  getAssessmentReports,
);

router.put(
  "/assessments/:assessmentId/alternatives/:medicineId",
  updateAlternativeDecision,
);

export default router;
