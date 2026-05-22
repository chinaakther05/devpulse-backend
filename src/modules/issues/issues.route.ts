import { Router } from "express";
import { issuesController } from "./issues.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddleware(), issuesController.createIssue);
router.get("/",  issuesController.getAllIssues);
router.get("/:id", issuesController.getSingleIssue);
router.patch("/:id", authMiddleware(), issuesController.updateIssue);
router.delete("/:id", authMiddleware(), issuesController.deleteIssue);

export const issuesRoute = router;