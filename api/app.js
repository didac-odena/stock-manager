import express from "express";
import logger from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./config/routes.config.js";

const app = express();

//Middlewares globales
app.use(logger("dev"));
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

//Montar rutas bajo /api
app.use("/api", router);

export default app;