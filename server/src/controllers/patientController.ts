import type {
  Response,
} from "express";

import {
  getAllPatients,
  getPatientById,
  createPatient,
} from "../services/patientService.js";

import type {
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";


// ======================================================
// GET ALL PATIENTS
// GET /api/patients
// ======================================================

export const getPatients =
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
          message: "Authentication required",
        });
      }

      const patients =
        await getAllPatients(
          doctorId,
        );

      return res.json({
        success: true,
        data: patients,
      });
    } catch (error) {
      console.error(
        "Get patients error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch patients",
      });
    }
  };


// ======================================================
// GET PATIENT
// GET /api/patients/:id
// ======================================================

export const getPatient =
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
          message: "Authentication required",
        });
      }

      const id =
        Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid patient ID",
        });
      }

      const patient =
        await getPatientById(
          id,
          doctorId,
        );

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      return res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      console.error(
        "Get patient error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch patient",
      });
    }
  };


// ======================================================
// CREATE PATIENT
// POST /api/patients
// ======================================================

export const addPatient =
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
          message: "Authentication required",
        });
      }

      const patient =
        await createPatient(
          doctorId,
          req.body,
        );

      return res.status(201).json({
        success: true,
        data: patient,
      });
    } catch (error) {
      console.error(
        "Create patient error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create patient",
      });
    }
  };