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


// Get all issues 
const getAllIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters = {
      sort: req.query.sort as string,
      type: req.query.type as string,
      status: req.query.status as string,
    };

    const result = await issuesService.getAllIssuesFromDB(filters);

    res.status(200).json({
      success: true,
      message: "Issues fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//  Get Single Issue 
const getSingleIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    
    const result = await issuesService.getSingleIssueFromDB(id as string);

   
    if (!result) {
      res.status(404).json({
        success: false,
        message: "Issue not found",
      });
      return; 
    }

    
    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    next(error);
  }
};

// 6. Update Issue 
const updateIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { title, description, type } = req.body;
  
  //  authMiddleware 
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  try {
   const result = await issuesService.updateIssueInDB(
  id as string, 
  userId, 
  userRole, 
  { title, description, type }
);

   
    if (result.errorType) {
      if (result.errorType === "NOT_FOUND") {
        res.status(404).json({ success: false, message: result.message });
        return;
      }
      if (result.errorType === "FORBIDDEN") {
        res.status(403).json({ success: false, message: result.message });
        return;
      }
      res.status(400).json({ success: false, message: result.message });
      return;
    }

  
    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result.data, 
    });

  } catch (error) {
    next(error);
  }
};



export const issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
};