import type { NextFunction, Request, Response } from "express";
import { issuesService } from "./issues.service";

// 1. Create issue 
const createIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const issuePayload = req.body;
    
    // authMiddleware 
    const reporterId = req.user?.id;

    if (!reporterId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
        errors: "User session not found or token invalid"
      });
      return;
    }

    
    const result = await issuesService.createIssueIntoDB(issuePayload, reporterId);

    
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error) {
   
    next(error); 
  }
};

export const issuesController = {
  createIssue,
};