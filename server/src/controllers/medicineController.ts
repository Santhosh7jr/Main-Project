import type {
  Request,
  Response,
} from "express";

import {
  searchMedicines,
  getMedicineById,
  getMedicinesForComparison,
} from "../services/medicineService.js";

import {
  compareMedicinesWithFlask,
} from "../services/medicineComparisonFlaskService.js";

// ============================================================
// Search medicines
// ============================================================

export const searchMedicine = async (
  req: Request,
  res: Response
) => {
  try {
    const search = String(
      req.query.search ?? ""
    );

    const medicines =
      await searchMedicines(search);

    return res.status(200).json({
      success: true,
      data: medicines,
    });
  } catch (error) {
    console.error(
      "Medicine search error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to search medicines.",
    });
  }
};

// ============================================================
// Get medicine
// ============================================================

export const getMedicine = async (
  req: Request,
  res: Response
) => {
  try {
    const medicineId = Number(
      req.params.id
    );

    if (!Number.isInteger(medicineId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicine ID.",
      });
    }

    const medicine =
      await getMedicineById(medicineId);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    console.error(
      "Get medicine error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get medicine.",
    });
  }
};

// ============================================================
// Compare medicines
// ============================================================

export const compareMedicines = async (
  req: Request,
  res: Response
) => {
  try {
    const medicine1Id = Number(
      req.body.medicine1Id
    );

    const medicine2Id = Number(
      req.body.medicine2Id
    );

    // --------------------------------------------------------
    // Validate
    // --------------------------------------------------------

    if (
      !Number.isInteger(medicine1Id) ||
      !Number.isInteger(medicine2Id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid medicine IDs are required.",
      });
    }

    if (medicine1Id === medicine2Id) {
      return res.status(400).json({
        success: false,
        message:
          "Please select two different medicines.",
      });
    }

    // --------------------------------------------------------
    // Get medicine data from PostgreSQL
    // --------------------------------------------------------

    const medicines =
      await getMedicinesForComparison(
        medicine1Id,
        medicine2Id
      );

    if (!medicines) {
      return res.status(404).json({
        success: false,
        message:
          "One or both medicines were not found.",
      });
    }

    console.log(
      "Comparing medicines:",
      medicines.medicine1.name,
      "vs",
      medicines.medicine2.name
    );

    console.log(
      "Medicine 1 uses:",
      medicines.medicine1.uses.length
    );

    console.log(
      "Medicine 1 side effects:",
      medicines.medicine1.sideEffects.length
    );

    console.log(
      "Medicine 2 uses:",
      medicines.medicine2.uses.length
    );

    console.log(
      "Medicine 2 side effects:",
      medicines.medicine2.sideEffects.length
    );

    // --------------------------------------------------------
    // Send complete data to Flask
    // --------------------------------------------------------

    const comparison =
      await compareMedicinesWithFlask(
        medicines.medicine1,
        medicines.medicine2
      );

    // --------------------------------------------------------
    // Return Flask comparison to frontend
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error(
      "Medicine comparison error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to compare medicines.",
    });
  }
};