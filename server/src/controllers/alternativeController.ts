import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

import {
  getAlternatives,
} from "../services/alternativeService.js";


export const findAlternativeMedicines =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {

    try {

      // --------------------------------------------------
      // 1. Validate request body
      // --------------------------------------------------

      if (!req.body) {

        return res.status(400).json({
          success: false,
          message:
            "Request body is required.",
        });
      }


      const {
        medicineId,
        patientId,
      } = req.body;


      // --------------------------------------------------
      // 2. Validate medicineId
      // --------------------------------------------------

      if (
        medicineId === undefined ||
        medicineId === null
      ) {

        return res.status(400).json({
          success: false,
          message:
            "medicineId is required.",
        });
      }


      const medicineIdNumber =
        Number(medicineId);


      if (
        !Number.isInteger(
          medicineIdNumber
        ) ||
        medicineIdNumber <= 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid medicineId.",
        });
      }

      const doctorId = req.doctorId;
      if (!doctorId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const patientIdNumber = Number(patientId);
      if (!Number.isInteger(patientIdNumber) || patientIdNumber <= 0) {
        return res.status(400).json({
          success: false,
          message: "A valid patientId is required.",
        });
      }

      // --------------------------------------------------
      // 3. Get alternatives
      // --------------------------------------------------

      const result =
        await getAlternatives({
          medicineId:
            medicineIdNumber,
          patientId: patientIdNumber,
          doctorId,
        });


      // --------------------------------------------------
      // 4. Return response
      // --------------------------------------------------

      return res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {

      console.error(
        "Alternative controller error:",
        error
      );

      if (error instanceof Error && error.message === "Patient not found.") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to find alternative medicines.",
      });
    }
  };