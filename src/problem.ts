import express from "express";
import jwt from "jsonwebtoken";
import { successResponse, errorResponse } from "./utils";
import { prisma } from "./db";
import { authMiddleware, creatorAuth } from "./middleware";
const router = express.Router();

router.post("/problems", authMiddleware, creatorAuth, async (req, res) => {})

export default router;