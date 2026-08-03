import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// POST /api/auth/register — Create a new account
router.post("/register", register);

// POST /api/auth/login — Login with credentials
router.post("/login", login);

// GET /api/auth/me — Get current user profile (protected)
router.get("/me", auth, getMe);

export default router;
