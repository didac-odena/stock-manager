import "dotenv/config";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import User from "../models/User.model.js";
import Product from "../models/Product.model.js";
import Review from "../models/Review.model.js";
import { CATEGORIES } from "../config/categories.config.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/retail-catalog-dev";

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

function createProduct(adminId) {
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: Number(faker.commerce.price(5, 500)),
    stock: faker.number.int({ min: 0, max: 100 }),
    categories: pickCategories(),
    owner: adminId,
  };
}

function createReview(productId) {
  return {
    email: faker.internet.email().toLocaleLowerCase(),
    rating: faker.number.int({ min: 1, max: 5 }),
    product: productId,
  };
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

    // Crear productos y reviews
    const productDocs = Array.from({ length: 15 }, () =>
      createProduct(admin._id),
    );
    const products = await Product.create(productDocs);
    console.log("Products created:", products.length);

    // Crear reviews para cada producto
    const reviewDocs = [
      createReview(products[0]._id),
      createReview(products[0]._id),
      createReview(products[1]._id),
      createReview(products[7]._id),
    ];

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
