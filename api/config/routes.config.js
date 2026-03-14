import { Router } from "express";
import createHttpError from "http-errors";
import { CATEGORIES } from "./categories.config.js";
import * as authController from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import * as productsController from "../controllers/products.controller.js";
import { validateObjectId } from "../middlewares/validate-object.middleware.js";

const router = Router();

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Categories route
router.get("/categories", (req, res) => {
  res.json(CATEGORIES);
});

// Auth routes (Public)
router.post("/login", authController.login);
router.post("/register", authController.register);

// Auth routes (Private)
router.post("/logout", isAuthenticated, authController.logout);
router.get("/me", isAuthenticated, authController.me);
router.patch("/me", isAuthenticated, authController.updateProfile);

//Invitation route
router.post("/invitations", isAuthenticated, authController.createInvitation);

// Product routes
// Public routes
router.get("/products", productsController.list);
router.get("/products/barcode/:barcode", isAuthenticated, productsController.findByBarcode);// Esta ruta es privada porque queremos proteger la información de los productos por código de barras
router.get("/products/:id", validateObjectId,productsController.details);
// Private routes
router.post("/products", isAuthenticated, productsController.create);
router.patch("/products/:id", isAuthenticated, validateObjectId, productsController.update);
router.delete("/products/:id", isAuthenticated, validateObjectId, productsController.remove);


// 404 catch-all
router.use((req, res, next) => {
  next(createHttpError(404, "Route not found"));
});

export default router;
