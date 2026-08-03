import express from "express";
import { createTask, updateTask } from "../controllers/taskController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all task routes
router.use(auth);

// POST / — Create a new task card
router.post("/", createTask);

// PUT /:id — Update task details
router.put("/:id", updateTask);

export default router;
