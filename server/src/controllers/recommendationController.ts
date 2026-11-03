import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { recommendMedicines } from "../services/recommendationService.js";

const isTextList = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every(
    (item) => typeof item === "string" && item.trim().length > 0 && item.length <= 200,
  );

export const getMedicineRecommendations = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const patientId = Number(req.body?.patientId);
  const doctorId = req.doctorId;
  const { problems, sideEffects } = req.body ?? {};

  if (!doctorId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }
  if (!Number.isInteger(patientId) || patientId <= 0) {
    return res.status(400).json({
      success: false,
      message: "A valid patientId is required.",
    });
  }
  if (!isTextList(problems) || problems.length === 0 || problems.length > 10) {
    return res.status(400).json({
      success: false,
      message: "Enter between 1 and 10 patient problems, each up to 200 characters.",
    });
  }
  if (
    sideEffects !== undefined &&
    (!isTextList(sideEffects) || sideEffects.length > 10)
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter no more than 10 side effects, each up to 200 characters.",
    });
  }

  try {
    const recommendations = await recommendMedicines({
      patientId,
      doctorId,
      problems: problems.map((problem: string) => problem.trim()),
      sideEffects: (sideEffects ?? []).map((effect: string) => effect.trim()),
    });

    return res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Patient not found.") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Medicine recommendation error:", error);
    if (error instanceof Error && error.message.startsWith("Gemini")) {
      return res.status(
        error.message.includes("not configured") ? 503 : 502,
      ).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to generate medicine matches.",
    });
  }
};
