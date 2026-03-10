import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.model.js";
import Product from "./models/Product.model.js";
import Review from "./models/Review.model.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/stock-manager-dev";

async function testModels() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB\n");

    // Limpiar datos previos
    await Review.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // 1. Crear un usuario
    const admin = await User.create({
      name: "Admin Test",
      email: "admin@test.com",
      password: "Password123!",
    });
    console.log("User created:", admin.name);

    // 2. Crear un producto con categorias y barcode
    const product = await Product.create({
      name: "Camiseta Basica",
      description: "Camiseta de algodon 100%",
      price: 19.99,
      stock: 25,
      categories: ["Ropa"],
      barcode: "1234567890123",
      owner: admin._id,
    });
    console.log("Product created:", product.name);

    // 3. Crear una review
    const review = await Review.create({
      email: "visitante@test.com",
      rating: 4,
      product: product._id,
    });
    console.log("Review created:", review.rating, "stars");

    // 4. Probar populate directo (Product -> owner)
    const populatedProduct = await Product.findById(product._id)
      .populate("owner", "name email");
    console.log("\n--- Product con populate owner ---");
    console.log(JSON.stringify(populatedProduct, null, 2));

    // 5. Probar virtual populate (Product -> reviews)
    const productWithReviews = await Product.findById(product._id)
      .populate("reviews");
    console.log("\n--- Product con virtual populate reviews ---");
    console.log(JSON.stringify(productWithReviews, null, 2));

    // 6. Probar indice compuesto (no puede haber dos reviews del mismo email+producto)
    try {
      await Review.create({
        email: "visitante@test.com",
        rating: 5,
        product: product._id,
      });
    } catch (error) {
      console.log("\n--- Compound unique index check ---");
      console.log("Duplicate email + product rejected correctly.");
      console.log(error.message);
    }

    // Limpiar
    await Review.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log("\nTest data cleaned up");
  } finally {
    await mongoose.connection.close();
  }
}

testModels();
