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
import { id } from "zod/locales";
const router = Router();

//create contest
router.post(
  "/create",
  authMiddleware,
  creatorAuth,
  apiLimiter,
  async (req: Request, res: Response) => {
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

router.get(
  "/:contestId",
  authMiddleware,
  apiLimiter,
  async (req: Request, res: Response) => {
    try {
      if (typeof req.params.contestId !== "string")
        return errorResponse(res, "Invalid contest ID", 400);
      const contestId = parseInt(req.params.contestId);
      const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        include: {
          mcqs: true,
          dsaProblems: true,
        },
      });

      if (!contest) return errorResponse(res, "Contest not found", 404);

      const isCreator = req.user!.id === contest.creator_id;

      const formatMcqs = (mcqs: any) => {
        const base = {
          id: mcqs.id,
          questionText: mcqs.question_text,
          options: mcqs.options,
          points: mcqs.points,
        };
        if (isCreator)
          return { ...base, correctOptionIndex: mcqs.correct_option_index };
        return base;
      };

      const formatDsaProblems = (problem: any) => {
        const base = {
          id: problem.id,
          title: problem.title,
          description: problem.description,
          tags: problem.tags,
          points: problem.points,
          timeLimit: problem.time_limit,
          memoryLimit: problem.memory_limit,
        };
        if (isCreator) return { ...base, testCases: problem.test_cases };
        return base;
      };

      res.json(
        successResponse(
          res,
          {
            id: contest.id,
            title: contest.title,
            description: contest.description,
            startTime: contest.start_time,
            endTime: contest.end_time,
            creatorId: contest.creator_id,
            mcqs: contest.mcqs.map(formatMcqs),
            dsaProblems: contest.dsaProblems.map(formatDsaProblems),
          },
          200,
        ),
      );
    } catch (error) {
      console.error("Get contest error:", error);
      errorResponse(res, "Failed to fetch contest details", 500);
    }
  },
);

router.post('/:contestId/mcq', authMiddleware, creatorAuth, apiLimiter, async (req: Request, res: Response) => {
  try {
    
  } catch (error) {
    
  }
})

export default router;
