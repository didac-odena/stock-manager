import multer from "multer";
import { storage } from "../config/cloudinary.config.js";

export const upload = multer({ storage });
