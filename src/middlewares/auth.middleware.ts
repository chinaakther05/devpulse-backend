import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import type { JwtPayload } from "jsonwebtoken";


declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { id: number; name: string; role: string };
    }
  }
}

export const authMiddleware = (...requiredRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // token from Authorization
      const authHeader = req.headers.authorization;

      //  'Bearer <token>' format and raw token strings
      const token = authHeader && authHeader.startsWith("Bearer ") 
        ? authHeader.split(" ")[1] 
        : authHeader;

     
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          errors: "Missing, expired, or invalid JWT token"
        });
        return;
      }

      // Verify JWT token
      const secretKey = (config && "secret" in config ? config.secret : "mySuperSecretLongTokenKey123456!") as string;
      const decoded = jwt.verify(token, secretKey) as JwtPayload & { id: number; name: string; role: string };

      
      req.user = decoded;

      // 4.  authorization check
      if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden",
          errors: "Valid token but insufficient role/permissions"
        });
        return;
      }

      //  middleware or controller
      next();
    } catch (error) {
      
      res.status(401).json({
        success: false,
        message: "Unauthorized",
        errors: "Missing, expired, or invalid JWT token"
      });
    } 
  };
};