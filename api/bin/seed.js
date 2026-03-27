import "dotenv/config";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import User from "../models/User.model.js";
import Product from "../models/Product.model.js";
import Review from "../models/Review.model.js";
import { CATEGORIES } from "../config/categories.config.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/retail-catalog-dev";
const DUMMYJSON_PRODUCTS_API_URL = "https://dummyjson.com/products?limit=0&select=images";
const TOTAL_REVIEWS_TO_SEED = 400;

const ADMIN_DATA = {
  name: "Admin",
  email: "admin@retailcatalog.com",
  password: "Admin123!",
};

function pickCategories() {
  return faker.helpers.arrayElements(
    CATEGORIES,
    faker.number.int({ min: 1, max: 2 }),
  );
}

function pickRandomProductImage(productImagePool) {
  if (productImagePool.length === 0) {
    return null;
  }

  return faker.helpers.arrayElement(productImagePool);
}

function createProduct(adminId, productImagePool) {
  const randomProductImageUrl = pickRandomProductImage(productImagePool);

  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: Number(faker.commerce.price(5, 500)),
    stock: faker.number.int({ min: 0, max: 100 }),
    categories: pickCategories(),
    images: randomProductImageUrl ? [randomProductImageUrl] : [],
    owner: adminId,
  };
}

function createReview(productId, reviewNumber) {
  return {
    email: `reviewer${reviewNumber}@seed.local`,
    rating: faker.number.int({ min: 1, max: 5 }),
    product: productId,
  };
}

async function fetchProductImagePool() {
  try {
    const imagesApiResponse = await fetch(DUMMYJSON_PRODUCTS_API_URL);

    if (!imagesApiResponse.ok) {
      throw new Error(`Status ${imagesApiResponse.status}`);
    }

    const imagesApiBody = await imagesApiResponse.json();
    const rawProductImagePool = imagesApiBody.products.flatMap((productData) =>
      Array.isArray(productData.images) ? productData.images : [],
    );
    const validProductImagePool = rawProductImagePool.filter(
      (imageUrl) => typeof imageUrl === "string" && imageUrl.trim() !== "",
    );
    const uniqueProductImagePool = [...new Set(validProductImagePool)];

    console.log("Product images fetched:", uniqueProductImagePool.length);
    return uniqueProductImagePool;
  } catch (error) {
    console.warn("Could not fetch product images. Using placeholder fallback.");
    console.warn("Reason:", error.message);
    return [];
  }
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");

    // Limpiar datos previos
    await Review.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log("Previous data cleared");

    // Crear admin
    const admin = await User.create(ADMIN_DATA);
    console.log("Admin user created:", admin.email);

    const productImagePool = await fetchProductImagePool();

    // Crear productos y reviews
    const productDocs = Array.from({ length: 200 }, () =>
      createProduct(admin._id, productImagePool),
    );
    const products = await Product.create(productDocs);
    console.log("Products created:", products.length);

    // Crear reviews para productos aleatorios
    const reviewDocs = Array.from({ length: TOTAL_REVIEWS_TO_SEED }, (_unused, index) => {
      const randomProduct = faker.helpers.arrayElement(products);
      return createReview(randomProduct._id, index + 1);
    });

    const reviews = await Review.create(reviewDocs);
    console.log("Reviews created:", reviews.length);

    console.log("\nSeed completed successfully!");
    console.log("Login: admin@retailcatalog.com / admin1234");
  } catch (error) {
    console.error("Seed failed:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("DB connection closed");
  }
}

seed();
