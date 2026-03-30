import express from "express";
import logger from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./config/routes.config.js";
import { clearBody } from "./middlewares/clear-body.middleware.js";
import { errorHandler } from "./middlewares/error-handler.middleware.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIST_PATH = path.join(__dirname, "public");

//Middlewares globales
app.use(logger("dev"));
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(clearBody);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(FRONTEND_DIST_PATH));
}

//Montar rutas bajo /api
app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(FRONTEND_DIST_PATH, "index.html"));
  });
}

//Error handling middleware
app.use(errorHandler);

export default app;
