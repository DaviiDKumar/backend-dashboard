import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"; // ✅ new
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import fileRoutes from "./routes/files.js";
import authCheckRoutes from "./routes/authCheck.js";


dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS with credentials for cookies
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // frontend URL
  credentials: true
}));

app.use(cookieParser()); // ✅ parse cookies
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);

app.use("/api/auth", authCheckRoutes); // ✅ add this


app.listen(PORT, () => {
  console.log(`Server running on `);
})
