import createHttpError from "http-errors";
import Product from "../models/Product.model.js";

// List products with pagination, filtering and search
export async function list(req, res) {
  const { category, search, page = 1, limit = 12 } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  //Dinamic filters
  const filters = {};

  if (category) {
    filters.categories = category; // Filtrar por categoría
  }

  if (search) {
    filters.name = { $regex: search, $options: "i" }; // Búsqueda por nombre (case-insensitive)
  }

  //Execute query and parallelize count and find
  const [products, total] = await Promise.all([
    Product.find(filters)
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filters),
  ]);

  res.json({
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
    data: products,
  });
}

// Get product details by ID
export async function details(req, res) {
  const product = await Product.findById(req.params.id).populate(
    "owner",
    "name email avatar",
  );

  if (!product) {
    throw createHttpError(404, "Product not found");
  }
  res.json(product);
}

// Get product details by barcode
export async function findByBarcode(req, res) {
  const product = await Product.findOne({ barcode: req.params.barcode }).populate(
    "owner",
    "name",
  );

  if (!product) {
    throw createHttpError(404, "Product not found");
  }
  res.json(product);
}

//create product
export async function create(req, res) {
  const product = await Product.create({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    stock: req.body.stock,
    categories: req.body.categories,
    barcode: req.body.barcode,
    owner: req.userId, // El ID del usuario autenticado que viene del middleware de autenticación
  });

  res.status(201).json(product);
}

//update product
export async function update(req, res) {
  const updateData = {
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    stock: req.body.stock,
    categories: req.body.categories,
  };

  // Solo actualizamos el código de barras si se proporciona en la solicitud
  if (req.body.barcode !== undefined) {
    updateData.barcode = req.body.barcode || undefined; // Si se envía una cadena vacía, la convertimos a undefined para eliminar el campo
      }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true },
  );

  if (!product) {
    throw createHttpError(404, "Product not found");
  }
  res.json(product);
}

//delete product
export async function remove(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    throw createHttpError(404, "Product not found");
  }
  res.status(204).end();
}

