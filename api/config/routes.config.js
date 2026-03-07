import { Router } from "express";
import createHttpError from "http-errors";
import { CATEGORIES } from "./categories.config.js";

const router = Router();

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Devuelve la lista categorias
router.get("/categories", (req, res) => {
  res.json(CATEGORIES);
});

// 404 catch-all
router.use(() => {
  throw createHttpError(404, "Route not found");
});

export default router;