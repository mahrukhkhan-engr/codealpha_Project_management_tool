import express from "express";
import {
  createProject,
  getProjects,
  addProjectMember,
} from "../controllers/projectController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all project routes
router.use(auth);

// POST / — Create a new project
router.post("/", createProject);

// GET / — Fetch all projects where the user is a member/owner
router.get("/", getProjects);

// POST /:id/members — Invite/add a member to a project
router.post("/:id/members", addProjectMember);

export default router;
