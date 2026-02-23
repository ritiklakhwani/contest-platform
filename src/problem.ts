import type { Request, Response } from "express";
import { Router } from "express";
import { successResponse, errorResponse, isContestActive } from "./utils";
import { prisma } from "./db";
import { createDsaProblemSchema, submitDsaProblemSchema } from "./zod";
import {
  authMiddleware,
  creatorAuth,
  apiLimiter,
  submissionLimiter,
} from "./middleware";
const router = Router();

//create DSA problem
router.post(
  "/:contestId/dsa",
  authMiddleware,
  creatorAuth,
  apiLimiter,
  async (req: Request, res: Response) => {
    try {
      if (typeof req.params.contestId !== "string")
        return errorResponse(res, "Invalid contest ID", 400);
      const contestId = parseInt(req.params.contestId);
      if (!contestId) return errorResponse(res, "Invalid contest ID", 400);

      const parsed = createDsaProblemSchema.safeParse(req.body);
      if (!parsed.success)
        return errorResponse(res, "Invalid request schema", 400);

      const {
        title,
        description,
        tags,
        points,
        timeLimit,
        memoryLimit,
        testCases,
      } = parsed.data;

      const contest = await prisma.contest.findUnique({
        where: { id: contestId },
      });
      if (!contest) return errorResponse(res, "Contest not found", 404);

      if (contest.creator_id !== req.user!.id)
        return errorResponse(res, "Forbidden", 403);
      if (isContestActive(contest.start_time, contest.end_time))
        return errorResponse(
          res,
          "Cannot add problems to an active contest",
          400,
        );

      const problem = await prisma.dsaProblem.create({
        data: {
          contest_id: contestId,
          title,
          description,
          tags,
          points,
          time_limit: timeLimit,
          memory_limit: memoryLimit,
          testCases: {
            create: testCases.map((testCase) => ({
              input: testCase.input,
              expected_output: testCase.expectedOutput,
              is_hidden: testCase.isHidden,
            })),
          },
        },
      });

      res.json(
        successResponse(
          res,
          {
            message: "Problem created successfully",
            id: problem.id,
            contest_id: problem.contest_id,
          },
          201,
        ),
      );
    } catch (error) {
      console.error("Create DSA problem error:", error);
      errorResponse(res, "Internal server error", 500);
    }
  },
);

//get dsa problem details
router.get(
  "/:problemId",
  authMiddleware,
  apiLimiter,
  async (req: Request, res: Response) => {
    try {
      if (typeof req.params.problemId !== "string")
        return errorResponse(res, "Invalid problem ID", 400);
      const problemId = parseInt(req.params.problemId);
      if (!problemId) return errorResponse(res, "Invalid problem ID", 400);

      const problem = await prisma.dsaProblem.findUnique({
        where: { id: problemId },
        include: { testCases: { where: { is_hidden: false } } },
      });

      if (!problem) return errorResponse(res, "Problem not found", 404);

      res.json(
        successResponse(
          res,
          {
            id: problem.id,
            contest_id: problem.contest_id,
            title: problem.title,
            description: problem.description,
            tags: problem.tags,
            points: problem.points,
            time_limit: problem.time_limit,
            memory_limit: problem.memory_limit,
            visible_test_cases: problem.testCases.map((testCase) => ({
              id: testCase.id,
              input: testCase.input,
              expected_output: testCase.expected_output,
            })),
          },
          200,
        ),
      );
    } catch (error) {
      console.error("Get DSA problem error:", error);
      errorResponse(res, "Internal server error", 500);
    }
  },
);

//submit dsa solution
router.post(
  "/:problemId/submit",
  authMiddleware,
  submissionLimiter,
  async (req: Request, res: Response) => {
    try {
      if (typeof req.params.problemId !== "string")
        return errorResponse(res, "Invalid problem ID", 400);
      const problemId = parseInt(req.params.problemId);
      if (!problemId) return errorResponse(res, "Invalid problem ID", 400);

      const parsed = submitDsaProblemSchema.safeParse(req.body);
      if (!parsed.success)
        return errorResponse(res, "Invalid request schema", 400);

      const { code, language } = parsed.data;

      const problem = await prisma.dsaProblem.findUnique({
        where: { id: problemId },
        include: { contest: true, testCases: true },
      });
      if (!problem) return errorResponse(res, "Problem not found", 404);

      if (problem.contest.creator_id === req.user!.id)
        return errorResponse(
          res,
          "Creators cannot submit solutions to their own problems",
          403,
        );
      if (
        !isContestActive(problem.contest.start_time, problem.contest.end_time)
      )
        return errorResponse(res, "Contest is not active", 400);

        //judge0 implementation

        //send response with submission status and results

    } catch (error) {
      console.error("Submit DSA solution error:", error);
      errorResponse(res, "Internal server error", 500);
    }
  },
);

export default router;
