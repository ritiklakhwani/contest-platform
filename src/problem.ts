import type { Request, Response } from "express";
import e, { Router } from "express";
import { successResponse, errorResponse, isContestActive } from "./utils";
import { prisma } from "./db";
import { createDsaProblemSchema, submitDsaProblemSchema } from "./zod";
import { authMiddleware, creatorAuth, apiLimiter, authLimiter, submissionLimiter } from "./middleware";
const router = Router();

//create DSA problem
router.post("/:contestId/dsa", authMiddleware, creatorAuth, apiLimiter, async (req: Request, res: Response) => {
    try {
        if(typeof req.params.contestId !== "string") return errorResponse(res, "Invalid contest ID", 400);
    const contestId = parseInt(req.params.contestId);
    if(!contestId) return errorResponse(res, "Invalid contest ID", 400);

    const parsed = createDsaProblemSchema.safeParse(req.body);
    if(!parsed.success) return errorResponse(res, "Invalid request schema", 400);

    const { title, description, tags, points, timeLimit, memoryLimit, testCases  } = parsed.data;

    const contest = await prisma.contest.findUnique({ where: { id: contestId } });
    if(!contest) return errorResponse(res, "Contest not found", 404);

    if(contest.creator_id !== req.user!.id) return errorResponse(res, "Forbidden", 403);
    if(isContestActive(contest.start_time, contest.end_time)) return errorResponse(res, "Cannot add problems to an active contest", 400);

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
                }))
            },
        }
    })

    res.json(successResponse(res, { message: "Problem created successfully",id: problem.id, contest_id: problem.contest_id }, 201));
    } catch (error) {
        console.error('Create DSA problem error:', error);
        errorResponse(res, "Internal server error", 500);
    }
});




export default router;
