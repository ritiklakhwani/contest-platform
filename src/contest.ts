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
import { id, is } from "zod/locales";
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

router.post(
  "/:contestId/mcq",
  authMiddleware,
  creatorAuth,
  apiLimiter,
  async (req: Request, res: Response) => {
    try {
      if (typeof req.params.contestId !== "string")
        return errorResponse(res, "Invalid contest ID", 400);

      const contestId = parseInt(req.params.contestId);
      const parsed = createMcqSchema.safeParse(req.body);

      if (!parsed.success)
        return errorResponse(res, "Invalid request body", 400);

      const contest = await prisma.contest.findUnique({
        where: { id: contestId },
      });

      if (!contest) return errorResponse(res, "Contest not found", 404);
      if (contest.creator_id !== req.user!.id)
        return errorResponse(res, "Unauthorized", 403);

      const { question, options, correctOptionIndex, points } = parsed.data;

      if (correctOptionIndex >= options.length)
        return errorResponse(res, "Correct option index out of bounds", 400);

      const mcq = await prisma.mcqQuestion.create({
        data: {
          contest_id: contestId,
          question_text: question,
          options,
          correct_option_index: correctOptionIndex,
          points,
        },
      });

      res.json(successResponse(res, { mcqId: mcq.id, contestId: mcq.contest_id }, 201));
    } catch (error: any) {
      console.error('Create MCQ error:', error);
      errorResponse(res, "Failed to create MCQ", 500);
    }
  },
);

router.post ('/:contestId/mcq/:mcqId/submit', authMiddleware, submissionLimiter, async (req: Request, res: Response) => {
  try {
    if (typeof req.params.contestId !== "string" || typeof req.params.mcqId !== "string")
      return errorResponse(res, "Invalid contest ID or MCQ ID", 400);

    const contestId = parseInt(req.params.contestId);
    const mcqId = parseInt(req.params.mcqId);
    const parsed = submitMcqSchema.safeParse(req.body);

    if (!parsed.success)
      return errorResponse(res, "Invalid request body", 400);

    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) return errorResponse(res, "Contest not found", 404);

    if(!isContestActive(contest.start_time, contest.end_time))
      return errorResponse(res, "Contest is not active", 400);

    const mcq = await prisma.mcqQuestion.findUnique({
      where: { id: mcqId },
    });

    if (!mcq || mcq.contest_id !== contestId)
      return errorResponse(res, "MCQ not found in this contest", 404);

    const existingSubmission = await prisma.mcqSubmission.findFirst({
      where: {
        user_id: req.user!.id,
        question_id: mcqId,
      },
    });

    if (existingSubmission) return errorResponse(res, "You have already submitted an answer for this question", 400);

    const isCorrect = parsed.data.selectedOptionIndex === mcq.correct_option_index;
    const pointsEarned = isCorrect ? mcq.points : 0;

    await prisma.mcqSubmission.create({
      data: {
        user_id: req.user!.id,
        question_id: mcqId,
        selected_option_index: parsed.data.selectedOptionIndex,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      },
    });
    
    res.json(successResponse(res, { correct: isCorrect, pointsEarned }, 200));
  } catch (error: any) {
    console.error('Submit MCQ answer error:', error);
    errorResponse(res, "Failed to submit answer", 500);
  }
});




export default router;
