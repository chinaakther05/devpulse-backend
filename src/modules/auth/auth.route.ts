import { Router } from "express";
import authController from "./auth.controller";


const router = Router();

// ১. ইউজার রেজিস্ট্রেশন রাউট -> POST /api/auth/signup
router.post("/signup", authController.signupController);

// ২. ইউজার লগইন রাউট -> POST /api/auth/login
router.post("/login", authController.loginController);

export const authRoute = router;