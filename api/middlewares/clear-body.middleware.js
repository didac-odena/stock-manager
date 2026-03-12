export function clearBody(req, res, next) {
  delete req.body?._id; // Eliminar _id si existe
  delete req.body?.createdAt; // Eliminar createdAt si existe
  delete req.body?.updatedAt; // Eliminar updatedAt si existe
  next();
}