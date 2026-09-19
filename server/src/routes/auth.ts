import { Router } from "express";

import {
  registerDoctor,
  loginDoctor,
} from "../services/authService.js";

import pool from "../config/database.js";

import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/authMiddleware.js";

const router = Router();

// ======================================================
// REGISTER
// POST /api/auth/register
// ======================================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      specialization,
    } = req.body;

    const doctor = await registerDoctor({
      name,
      email,
      password,
      specialization,
    });

    return res.status(201).json({
      success: true,
      message: "Doctor registered successfully",
      doctor,
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error,
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Registration failed",
    });
  }
});

// ======================================================
// LOGIN
// POST /api/auth/login
// ======================================================

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const result = await loginDoctor({
      email,
      password,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    console.error(
      "Login error:",
      error,
    );

    return res.status(401).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Login failed",
    });
  }
});

// ======================================================
// CURRENT DOCTOR
// GET /api/auth/me
// ======================================================

router.get(
  "/me",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const doctorId = req.doctorId;

      if (!doctorId) {
        return res.status(401).json({
          success: false,
          message: "Invalid authentication",
        });
      }

      const result = await pool.query(
        `
        SELECT
          id,
          name,
          email,
          specialization
        FROM doctors
        WHERE id = $1
        `,
        [doctorId],
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Doctor account no longer exists",
        });
      }

      const doctor = result.rows[0];

      return res.status(200).json({
        success: true,
        doctor: {
          id: doctor.id,
          name: doctor.name,
          email: doctor.email,
          specialization: doctor.specialization,
        },
      });
    } catch (error) {
      console.error(
        "Get current doctor error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to get doctor",
      });
    }
  },
);

export default router;