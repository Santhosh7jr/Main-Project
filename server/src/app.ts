import express from "express";
import cors from "cors";

import patientRoutes from "./routes/patientRoutes.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import alternativeRoutes from "./routes/alternativeRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import authRoutes from "./routes/auth.js";

const app = express();

/*
 * CORS
 */
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

/*
 * Body parsers
 *
 * IMPORTANT:
 * These must come BEFORE the routes.
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
 * Health check
 */
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "MedGuard server is running",
  });
});

/*
 * Routes
 */
app.use("/api/patients", patientRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/alternatives", alternativeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/auth", authRoutes);

/*
 * 404 handler
 */
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

/*
 * Error handler
 */
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled server error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  },
);

export default app;
