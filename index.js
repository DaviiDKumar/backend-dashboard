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
import reassignRoutes from "./routes/reassign.js";
import archiveRoutes from "./routes/archive.js"; // IMPORT THE NEW FILE HERE


dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// Use the port from .env (Render provides this) or default to 5000 for local
const PORT = process.env.PORT || 5000; 

// 1. DYNAMIC CORS CONFIGURATION
// backend/index.js

// backend/index.js

// Replace your current app.use(cors(...)) with this:
// backend/index.js
// backend/index.js

app.use(cors({
  origin: [
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
    "https://frontend-dashboard-delta-rouge.vercel.app" // ✅ Your Vercel Frontend
  ], 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
// 2. MIDDLEWARE
app.use(cookieParser()); 
app.use(express.json());

// 3. BASE TEST ROUTE
app.get("/", (req, res) => {
  res.json({ 
    message: "DATATECH API is running smoothly", 
    system: "Bearer Token Auth Active",
    port: PORT,
    status: "online" 
  });
});

// 4. API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/auth", authCheckRoutes); 
app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/reassign", reassignRoutes);
app.use("/api/archive", archiveRoutes); // REGISTER THE NEW ARCHIVE ROUTE HERE


// 5. ERROR HANDLING
app.use((req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// 6. START SERVER
app.listen(PORT, () => {
  console.log(`>>> Server is live on port ${PORT}`);
});