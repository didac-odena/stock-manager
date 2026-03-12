import mongoose from "mongoose";
import createHttpError from "http-errors";

// Middleware validation for ObjectId parameters
export function validateObjectId(req, res, next) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, `Invalid ID format: ${id}`);
  }

  next();
}
