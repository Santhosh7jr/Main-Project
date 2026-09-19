import { Router } from "express";

import {
  requireAuth,
} from "../middleware/authMiddleware.js";

import {
  createAssessment,
} from "../controllers/assessmentController.js";

const router = Router();


// ======================================================
// All assessment routes require authentication
// ======================================================

router.use(requireAuth);


// ======================================================
// CREATE ASSESSMENT
// POST /api/assessments
// ======================================================

router.post(
  "/",
  createAssessment,
);


export default router;