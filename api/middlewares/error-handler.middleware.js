export function errorHandler(err, req, res, next) {
  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.errors });
  }

  // Mongoose cast error (e.g., invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Resource not found" });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({ message: "Duplicate key error" });
  }

  // Custom error with status
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  
  // Default to 500 server error
  console.error(err);
  return res.status(500).json({ message: "Internal Server Error" });
}
