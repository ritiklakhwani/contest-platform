import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import {errorResponse} from "./utils";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if(!header) return errorResponse(res, "Unauthorized", 401);

    const token = header?.split(" ")[1];
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

export const creatorAuth = (req: Request, res: Response, next: NextFunction) => {
    if(!req.user || req.user.role !== "creator") return errorResponse(res, "Forbidden", 403);
    next();
}


