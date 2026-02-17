import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "./db";
import { successResponse, errorResponse, isContestActive } from "./utils";
import { createContestSchema, createMcqSchema, submitMcqSchema } from "./zod";
import {
  authMiddleware,
  creatorAuth,
  authLimiter,
  apiLimiter,
  submissionLimiter,
} from "./middleware";
const router = Router();

//create contest
router.post("/create", authMiddleware, creatorAuth, apiLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = createContestSchema.safeParse(req.body);
      if (!parsed.success) {
        return errorResponse(res, "Invalid request body", 400);
      }

      const { title, description, startTime, endTime } = parsed.data;

      if (new Date(startTime) >= new Date(endTime)) {
        return errorResponse(res, "Start time must be before end time", 400);
      }

      const contest = await prisma.contest.create({
        data: {
          title,
          description,
          start_time: new Date(startTime),
          end_time: new Date(endTime),
          creator_id: req.user!.id,
        },
      });

      res.status(201).json({
        success: true,
        message: "Contest created successfully",
        data: {
          contestId: contest.id,
          title: contest.title,
          description: contest.description,
          startTime: contest.start_time,
          endTime: contest.end_time,
          creatorId: contest.creator_id,
        },
      });
    } catch (e) {
      errorResponse(res, "Failed to create contest", 500);
    }
  },
);




export default router;
