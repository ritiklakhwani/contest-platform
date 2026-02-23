import express from "express";
import jwt from "jsonwebtoken";
import { successResponse, errorResponse } from "./utils";
import bcrypt from "bcrypt";
import { prisma } from "./db";
import { signupSchema, loginSchema } from "./zod";

const router = express.Router();

//signup
router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return errorResponse(res, "invalid request", 400);

  const { name, email, password, role = "contestee" } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return errorResponse(res, "email already exists", 400);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  });

  res.status(201).json({
    success: true,
    message: "user created successfully",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

//login
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return errorResponse(res, "invalid request schema", 400);

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return errorResponse(res, "invalid email or password", 400);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return errorResponse(res, "invalid email or password", 400);

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET_KEY as string,
    { expiresIn: "7d" },
  );

  return successResponse(res, { token }, 200);
});

export default router;
