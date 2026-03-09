import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.model.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/stock-manager-dev";

async function testUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");

    const email = "test@test.com";

    // 1. Crear usuario
    const user = await User.create({
      name: "Test Admin",
      email,
      password: "Password123!",
    });

    console.log("\n--- Usuario creado (toJSON) ---");
    console.log(JSON.stringify(user, null, 2));
    // Deberia mostrar: id, name, email, avatar, createdAt, updatedAt
    // NO deberia mostrar: _id, password, __v

    // 2. Verificar que el password esta hasheado en la DB
    const rawUser = await User.findOne({ email });
    console.log("\n--- Password en la DB (hasheado) ---");
    console.log(rawUser.password);
    // Deberia ser algo como: $2b$10$Ks3x...

    // 3. Probar checkPassword
    const isValid = await rawUser.checkPassword("Password123!");
    const isInvalid = await rawUser.checkPassword("wrongpassword");
    console.log("\n--- checkPassword ---");
    console.log("Password123! ->", isValid); // true
    console.log("wrongpassword ->", isInvalid); // false
  } catch (error) {
    if (error?.code === 11000) {
      console.log("\n--- unique index check ---");
      console.log("Duplicate email detected correctly.");
      console.log(error.keyValue);
      return;
    }

    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

testUser();
