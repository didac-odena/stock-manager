import { Router } from "express";
import createHttpError from "http-errors";
import { CATEGORIES } from "./categories.config.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Devuelve la lista categorias
router.get("/categories", (req, res) => {
  res.json(CATEGORIES);
});

// Auth routes
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// 404 catch-all
router.use((req, res, next) => {
  next(createHttpError(404, "Route not found"));
});

export default router;
