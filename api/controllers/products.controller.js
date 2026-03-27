import createHttpError from "http-errors";
import Product from "../models/Product.model.js";
import User from "../models/User.model.js";
import { cloudinary } from "../config/cloudinary.config.js";

const DAILY_IMAGE_UPLOAD_LIMIT = 3;
const DAILY_IMAGE_UPLOAD_LIMIT_MESSAGE =
  "This is a practice project and image uploads are limited to 3 per day. For more information, contact the administrator.";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getCloudinaryPublicId(file) {
  if (typeof file?.filename === "string" && file.filename.trim() !== "") {
    return file.filename;
  }

  if (typeof file?.path === "string" && file.path.trim() !== "") {
    const pathSegments = file.path.split("/upload/");

    if (pathSegments.length === 2) {
      const publicIdWithVersionAndExtension = pathSegments[1].replace(
        /^v\d+\//,
        "",
      );
      return publicIdWithVersionAndExtension.replace(/\.[^/.]+$/, "");
    }
  }

  return null;
}

async function deleteUploadedImages(files = []) {
  if (!Array.isArray(files) || files.length === 0) {
    return;
  }

  const uniquePublicIds = [...new Set(files.map(getCloudinaryPublicId).filter(Boolean))];

  if (uniquePublicIds.length === 0) {
    return;
  }

  await Promise.allSettled(
    uniquePublicIds.map((publicId) => cloudinary.uploader.destroy(publicId)),
  );
}

async function getUploadQuotaState(userId, files = []) {
  if (!Array.isArray(files) || files.length === 0) {
    return null;
  }

  const user = await User.findById(userId);

  if (!user) {
    await deleteUploadedImages(files);
    throw createHttpError(401, "User not found");
  }

  const today = getTodayKey();
  const currentCount =
    user.dailyImageUploadDate === today ? user.dailyImageUploadCount : 0;
  const nextCount = currentCount + files.length;

  if (nextCount > DAILY_IMAGE_UPLOAD_LIMIT) {
    await deleteUploadedImages(files);
    throw createHttpError(429, DAILY_IMAGE_UPLOAD_LIMIT_MESSAGE);
  }

  return { user, today, nextCount };
}

async function consumeUploadQuota(uploadQuotaState) {
  if (!uploadQuotaState) {
    return;
  }

  const { user, today, nextCount } = uploadQuotaState;
  user.dailyImageUploadDate = today;
  user.dailyImageUploadCount = nextCount;
  await user.save();
}

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
  const product = await Product.findOne({
    barcode: req.params.barcode,
  }).populate("owner", "name");

  if (!product) {
    throw createHttpError(404, "Product not found");
  }
  res.json(product);
}

//create product
export async function create(req, res) {
  const images = req.files ? req.files.map((file) => file.path) : [];
  const uploadQuotaState = await getUploadQuotaState(req.userId, req.files);

  let product;

  try {
    product = await Product.create({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      categories: req.body.categories,
      barcode: req.body.barcode,
      owner: req.userId,
      images,
    });
  } catch (error) {
    await deleteUploadedImages(req.files);
    throw error;
  }

  await consumeUploadQuota(uploadQuotaState);

  res.status(201).json(product);
}

//update product
export async function update(req, res) {
  const uploadQuotaState = await getUploadQuotaState(req.userId, req.files);

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

  if (req.files && req.files.length > 0) {
    updateData.images = req.files.map((file) => file.path);
  }

  let product;

  try {
    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
  } catch (error) {
    await deleteUploadedImages(req.files);
    throw error;
  }

  if (!product) {
    await deleteUploadedImages(req.files);
    throw createHttpError(404, "Product not found");
  }

  await consumeUploadQuota(uploadQuotaState);
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
