import jwt from "jsonwebtoken";
import createHttpError from "http-errors";

export function isAuthenticated(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    throw createHttpError(401, "Authentication token missing");
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId; // Agregar userId al objeto req para uso posterior en controladores
    next();
  } catch {
    throw createHttpError(401, "Invalid or expired token");
  }
}
