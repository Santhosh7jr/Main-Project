import { Router } from "express";

import {
  getPatients,
  getPatient,
  addPatient,
  editPatient,
  addCondition,
  addAllergy,
  addMedication,
  addAdverseReaction,
  addMeasurement,
  addClinicalNote,
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

router.put("/:id", editPatient);
router.post("/:id/conditions", addCondition);
router.post("/:id/allergies", addAllergy);
router.post("/:id/medications", addMedication);
router.post("/:id/adverse-reactions", addAdverseReaction);
router.post("/:id/measurements", addMeasurement);
router.post("/:id/clinical-notes", addClinicalNote);

export default router;