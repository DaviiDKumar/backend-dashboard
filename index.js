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
const PORT = process.env.PORT || 10000;

// 1. DYNAMIC CORS CONFIGURATION
const allowedOrigins = [
  "https://frontend-dashboard-delta-rouge.vercel.app", 
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    // Allow list check + Vercel preview wildcard check
    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Keep this true so it doesn't break existing dev environments
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"] // ✅ CRITICAL: Allows the Bearer Token
}));

// 2. MIDDLEWARE
app.use(cookieParser()); 
app.use(express.json());

// 3. BASE TEST ROUTE
app.get("/", (req, res) => {
  res.json({ 
    message: "DATATECH API is running smoothly", 
    system: "Bearer Token Auth Active",
    status: "online" 
  });
});

// 4. API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/auth", authCheckRoutes); 
app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);

// 5. ERROR HANDLING
app.use((req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// 6. START SERVER
app.listen(PORT, () => {
  console.log(`>>> Server is live on port ${PORT}`);
});