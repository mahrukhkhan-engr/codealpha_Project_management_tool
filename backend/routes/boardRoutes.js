import express from "express";
import { createBoard, getProjectBoards } from "../controllers/boardController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all board routes
router.use(auth);

// POST / — Create a board column inside a project
router.post("/", createBoard);

// GET /project/:projectId — Fetch all boards for a specific project with their tasks
router.get("/project/:projectId", getProjectBoards);

export default router;
