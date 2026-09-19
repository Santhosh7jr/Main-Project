import { Router } from "express";

import {
  requireAuth,
} from "../middleware/authMiddleware.js";

import {
  getAssessmentReports,
  getReportSummary,
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

export default router;
