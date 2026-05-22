import { Router } from "express";
import { issuesController } from "./issues.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddleware(), issuesController.createIssue);
router.get("/",  issuesController.getAllIssues);

export const issuesRoute = router;