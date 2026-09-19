import type {
  Request,
  Response,
} from "express";

import {
  getAlternatives,
} from "../services/alternativeService.js";


export const findAlternativeMedicines =
  async (
    req: Request,
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


      // --------------------------------------------------
      // 3. Get alternatives
      // --------------------------------------------------

      const result =
        await getAlternatives({
          medicineId:
            medicineIdNumber,
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


      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to find alternative medicines.",
      });
    }
  };