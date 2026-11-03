import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { verifyToken } from "../services/authService.js";

export interface AuthenticatedRequest extends Request {
  doctorId?: number;
  doctorEmail?: string;
}

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authorization = req.headers.authorization;

    // --------------------------------------------------
    // Authorization header required
    // --------------------------------------------------

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // --------------------------------------------------
    // Expected format:
    //
    // Authorization: Bearer TOKEN
    // --------------------------------------------------

    const parts = authorization.trim().split(/\s+/);

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer" ||
      !parts[1]
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization header",
      });
    }

    const token = parts[1];

    // --------------------------------------------------
    // Verify JWT
    // --------------------------------------------------

    const payload = verifyToken(token);

    if (
      !payload ||
      typeof payload.doctorId !== "number" ||
      !payload.email
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    // --------------------------------------------------
    // Attach authenticated doctor
    // --------------------------------------------------

    req.doctorId = payload.doctorId;
    req.doctorEmail = payload.email;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};