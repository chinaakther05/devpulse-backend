import { Router } from "express";
import { issuesController } from "./issues.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddleware(), issuesController.createIssue);
router.get("/",  issuesController.getAllIssues);
router.get("/:id", issuesController.getSingleIssue);
router.patch("/:id", authMiddleware(), issuesController.updateIssue);

export const issuesRoute = router;