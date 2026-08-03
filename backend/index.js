import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();

// Middleware - Allow cross origin requests for Vercel
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check routes
app.get("/", (req, res) => {
  res.json({
    message: "Project Management Tool API",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api", (req, res) => {
  res.json({
    message: "API is working",
    version: "1.0.0",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/tasks", taskRoutes);

// Local testing ke liye (Optional)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

// Vercel serverless function export
export default app;