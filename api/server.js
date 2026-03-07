import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.config.js";

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error(`Failed to connect to MongoDB`, error);
    process.exit(1);
  });
