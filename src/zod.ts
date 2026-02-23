import { z } from "zod";

// signup schema
export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.enum(["creator", "contestee"]).optional().default('contestee'),
});

// login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// contest creation schema
export const createContestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  startTime: z.string().datetime('Invalid datetime format'),
  endTime: z.string().datetime('Invalid datetime format'),
});

// MCQ creation schema
export const createMcqSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  options: z.array(z.string()).min(2, 'At least 2 options required'),
  correctOptionIndex: z.number().int().nonnegative('Invalid option index'),
  points: z.number().int().positive('Points must be a positive integer'),
});

// MCQ submission schema
export const submitMcqSchema = z.object({
  selectedOptionIndex: z.number().int().nonnegative('Invalid option index')
});

// Test case schema for DSA problems
export const testCaseSchema = z.object({
  input: z.string().min(1, 'Input is required'),
  expectedOutput: z.string().min(1, 'Expected output is required'),
  isHidden: z.boolean().default(false),
});

// DSA problem creation schema
export const createDsaProblemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  points: z.number().int().positive('Points must be a positive integer'),
  timeLimit: z.number().int().positive('Time limit must be a positive integer (in milliseconds)'),
  memoryLimit: z.number().int().positive('Memory limit must be a positive integer (in megabytes)'),
  testCases: z.array(testCaseSchema).min(1, 'At least one test case is required'),
})

// DSA problem submission schema
export const submitDsaProblemSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  language: z.string().min(1, 'Language is required'),
})

// Type definitions 
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;     
export type CreateContestInput = z.infer<typeof createContestSchema>;
export type CreateMcqInput = z.infer<typeof createMcqSchema>;
export type SubmitMcqInput = z.infer<typeof submitMcqSchema>;
export type CreateDsaProblemInput = z.infer<typeof createDsaProblemSchema>;
export type SubmitDsaProblemInput = z.infer<typeof submitDsaProblemSchema>;

