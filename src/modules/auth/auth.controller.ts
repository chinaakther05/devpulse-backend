
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import type { Request, Response } from "express";


// signup
export const signupController = async (req: Request, res: Response) => {
  try {
    const result = await authService.registerUserIntoDB(req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }
};

// login
export const loginController = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUserFromDB(req.body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }
};
export default { 
    signupController,
     loginController 
    };