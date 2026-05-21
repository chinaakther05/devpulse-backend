import { Router } from "express";
import authController from "./auth.controller";


const router = Router();


router.post("/signup", authController.signupController);


router.post("/login", authController.loginController);

export const authRoute = router;