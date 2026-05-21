import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";

export const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  //  determine status code and error 
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || err.stack || "Unexpected server or database error";

  //  return response 
  res.status(statusCode).json({
    success: false,
    message: message,
    errors: errors,
  });
};