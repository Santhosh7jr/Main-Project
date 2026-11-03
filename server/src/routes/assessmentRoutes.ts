import { Router } from "express";

import {
  requireAuth,
} from "../middleware/authMiddleware.js";

import {
  previewAssessment,
  createAssessment,
  updateAssessmentOutcome,
} from "../controllers/assessmentController.js";
import { getMedicineRecommendations } from "../controllers/recommendationController.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/recommendations",
  getMedicineRecommendations,
);

// AI/safety analysis only. No database write.
router.post(
  "/preview",
  previewAssessment,
);

// Explicit doctor selection. Creates history.
router.post(
  "/",
  createAssessment,
);

router.put("/:id/outcome", updateAssessmentOutcome);

export default router;
