
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import connectDatabase from "./config/database.js";

import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";

import {
  errorHandler,
  notFound,
} from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Remove trailing slash from frontend URL
const clientUrl = process.env.CLIENT_URL?.replace(/\/+$/, "");

// Middleware
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ message: "Job portal API is healthy" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Database Connection and Server Start
const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(port, () => {
      console.log(`API listening on ${port}`);
      console.log(`Allowed frontend: ${clientUrl}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
