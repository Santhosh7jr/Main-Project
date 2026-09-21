import { Router } from "express";

import {
  requireAuth,
} from "../middleware/authMiddleware.js";

import {
  previewAssessment,
  createAssessment,
} from "../controllers/assessmentController.js";

const router = Router();

router.use(requireAuth);

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

export default router;
