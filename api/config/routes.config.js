import { Router } from "express";
import createHttpError from "http-errors";
import { CATEGORIES } from "./categories.config.js";
import * as authController from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import * as productsController from "../controllers/products.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
import { validateObjectId } from "../middlewares/validate-object.middleware.js";
import * as ReviewsController from "../controllers/review.controller.js";

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

// Invitation route
router.post("/invitations", isAuthenticated, authController.createInvitation);

// Product Public routes
router.get("/products", productsController.list);
router.get("/products/barcode/:barcode", isAuthenticated, productsController.findByBarcode);// Esta ruta es privada porque queremos proteger la información de los productos por código de barras
router.get("/products/:id", validateObjectId,productsController.details);
// Product Private routes
router.post("/products", isAuthenticated, upload.array("images", 3), productsController.create);
router.patch("/products/:id", isAuthenticated, upload.array("images", 3), validateObjectId, productsController.update);
router.delete("/products/:id", isAuthenticated, validateObjectId, productsController.remove);

// Review routes PUBLIC
router.get("/products/:id/reviews", validateObjectId, ReviewsController.list); 
router.post("/products/:id/reviews", validateObjectId, ReviewsController.create);

// 404 catch-all
router.use((req, res, next) => {
  next(createHttpError(404, "Route not found"));
});

export default router;
