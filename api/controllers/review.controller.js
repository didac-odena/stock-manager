import createHttpError from "http-errors";
import Review from "../models/Review.model.js";
import Product from "../models/Product.model.js";

export async function list(req, res) {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw createHttpError(404, "Product not found");
  }

  const reviews = await Review.find({ product: req.params.id }).sort({
    createdAt: -1,
  });

  res.json(reviews);
}

export async function create(req, res) {
  const { email, rating } = req.body;

  if (!email || !rating) {
    throw createHttpError(400, "Email and rating are required");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    throw createHttpError(404, "Product not found");
  }

  const review = await Review.create({
    email,
    rating,
    product: req.params.id,
  });

  res.status(201).json(review);
}
