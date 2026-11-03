import { Router } from "express";

import {
  searchMedicine,
  getMedicine,
  getMedicineAIDetails,
  getMedicineAIEnrichment,
  compareMedicines,
} from "../controllers/medicineController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Search
router.get(
  "/search",
  searchMedicine
);

// Compare
router.post(
  "/compare",
  compareMedicines
);

router.post(
  "/:id/ai-details",
  requireAuth,
  getMedicineAIDetails,
);

router.post(
  "/:id/ai-enrichment",
  requireAuth,
  getMedicineAIEnrichment,
);

// Details
router.get(
  "/:id",
  getMedicine
);

export default router;