import { Router } from "express";

import {
  findAlternativeMedicines,
} from "../controllers/alternativeController.js";

import {
  requireAuth,
} from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/",
  findAlternativeMedicines
);

export default router;
