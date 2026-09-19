import { Router } from "express";

import {
  getPatients,
  getPatient,
  addPatient,
} from "../controllers/patientController.js";

import {
  requireAuth,
} from "../middleware/authMiddleware.js";

const router = Router();

// ======================================================
// All patient routes require authentication
// ======================================================

router.use(requireAuth);

// GET /api/patients
router.get(
  "/",
  getPatients,
);

// GET /api/patients/:id
router.get(
  "/:id",
  getPatient,
);

// POST /api/patients
router.post(
  "/",
  addPatient,
);

export default router;