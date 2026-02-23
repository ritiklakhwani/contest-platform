import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import {errorResponse} from "./utils";

// Authentication middleware to verify JWT tokens and protect routes
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    if(!token) return errorResponse(res, "Unauthorized", 401);

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
        if(typeof decoded === "string") return errorResponse(res, "Invalid token payload", 401);
        req.user = decoded;
        next();
    }catch(err){
        errorResponse(res, "Unauthorized", 401);
    }


}

// Middleware to check if the user is a creator
export const creatorAuth = (req: Request, res: Response, next: NextFunction) => {
    if(!req.user || req.user.role !== "creator") return errorResponse(res, "Forbidden", 403);
    next();
}

// authentication rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  handler: (req: Request, res: Response) => {
    errorResponse(res, "Too many requests, please try again later.", 429);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// general API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  handler: (req: Request, res: Response) => {
    errorResponse(res, "Too many requests, please try again later.", 429);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// submission rate limiter 
export const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  handler: (req: Request, res: Response) => {
    errorResponse(res, "Too many requests, please try again later.", 429);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

