import { Router } from "express";
import { issuesController } from "./issues.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddleware(), issuesController.createIssue);

export const issuesRoute = router;