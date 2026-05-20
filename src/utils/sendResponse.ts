import { type Response } from 'express';


export const sendSuccessResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data: any
) => {
  return res.status(statusCode).json({
    success: true,
    message: message,
    data: data,
  });
};


export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errors: any
) => {
  return res.status(statusCode).json({
    success: false,
    message: message,
    errors: errors,
  });
};