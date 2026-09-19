import { Router } from "express";

import {
  searchMedicine,
  getMedicine,
  compareMedicines,
} from "../controllers/medicineController.js";

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

// Details
router.get(
  "/:id",
  getMedicine
);

export default router;