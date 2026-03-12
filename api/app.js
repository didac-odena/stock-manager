import express from "express";
import logger from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./config/routes.config.js";
import { clearBody } from "./middlewares/clear-body.middleware.js";
import { errorHandler } from "./middlewares/error-handler.middleware.js";

const app = express();

//Middlewares globales
app.use(logger("dev"));
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(clearBody);

//Montar rutas bajo /api
app.use("/api", router);

//Error handling middleware
app.use(errorHandler);

export default app;