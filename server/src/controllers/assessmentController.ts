import type {
  Response,
} from "express";

import {
  runAssessment,
} from "../services/assessmentService.js";

import type {
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";


// ======================================================
// RUN ASSESSMENT
// POST /api/assessments
// ======================================================

export const createAssessment =
  async (
    req: AuthenticatedRequest,
    res: Response,
  ) => {
    try {
      const doctorId =
        req.doctorId;

      if (!doctorId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const {
        patientId,
        medicineId,
      } = req.body;

      // ------------------------------------------------
      // Validate patient ID
      // ------------------------------------------------

      const parsedPatientId =
        Number(patientId);

      if (
        !Number.isInteger(
          parsedPatientId,
        ) ||
        parsedPatientId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid patientId is required",
        });
      }

      // ------------------------------------------------
      // Validate medicine ID
      // ------------------------------------------------

      const parsedMedicineId =
        Number(medicineId);

      if (
        !Number.isInteger(
          parsedMedicineId,
        ) ||
        parsedMedicineId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid medicineId is required",
        });
      }

      // ------------------------------------------------
      // Run assessment
      // ------------------------------------------------

      const result =
        await runAssessment({
          doctorId,

          patientId:
            parsedPatientId,

          medicineId:
            parsedMedicineId,
        });

      return res.status(201).json({
        success: true,

        data: result,
      });
    } catch (error) {
      console.error(
        "Create assessment error:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Assessment failed";

      // ----------------------------------------------
      // Expected client errors
      // ----------------------------------------------

      if (
        message ===
          "Patient not found" ||
        message ===
          "Medicine not found"
      ) {
        return res.status(404).json({
          success: false,
          message,
        });
      }

      // ----------------------------------------------
      // ML service failure
      // ----------------------------------------------

      if (
        message.includes(
          "ML service",
        )
      ) {
        return res.status(503).json({
          success: false,
          message:
            "The ML service is currently unavailable. Please start the Flask API and try again.",
        });
      }

      // ----------------------------------------------
      // General server error
      // ----------------------------------------------

      return res.status(500).json({
        success: false,
        message:
          "Failed to run assessment",
      });
    }
  };