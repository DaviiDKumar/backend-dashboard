import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";

// Route Imports
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import fileRoutes from "./routes/files.js";
import authCheckRoutes from "./routes/authCheck.js";

dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. DYNAMIC CORS CONFIGURATION
// This allows your main Vercel URL, localhost, AND any Vercel preview links
const allowedOrigins = [
  "https://frontend-dashboard-bay.vercel.app", 
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list OR is a Vercel preview subdomain
    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Required for cookies to work online
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 2. MIDDLEWARE
app.use(cookieParser()); // Required to read/clear cookies
app.use(express.json());

// 3. BASE TEST ROUTE
app.get("/", (req, res) => {
  res.json({ message: "DATATECH API is running smoothly", status: "online" });
});

// 4. API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/auth", authCheckRoutes); // Used for session persistence
app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);

// 5. ERROR HANDLING (Catch-all for missing API routes)
app.use((req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// 6. START SERVER
app.listen(PORT, () => {
  console.log(`>>> Server is live in ${process.env.NODE_ENV} mode on port ${PORT}`);
});