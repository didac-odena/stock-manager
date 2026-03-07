import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/stock-manager-dev";

export function connectDB() {
  return mongoose.connect(MONGODB_URI).then((connection) => {
    console.log(`Connected to MongoDB: "${connection.connections[0].name}"`);
  });
}
