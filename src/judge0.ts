import axios from "axios";

const JUDGE0_URL =
  process.env.JUDGE0_API_URL || "https://judge0.nagmaniupadhyay.com.np";

const LANGUAGES: Record<string, number> = {
  javascript: 63,
  python: 71,
  cpp: 54,
  java: 62,
  c: 50,
};

export interface CodeResult {
  status: "accepted" | "wrong_answer" | "time_limit_exceeded" | "runtime_error";
  passed: number;
  total: number;
  executionTime?: number;
}

export async function runCode(code: string, language: string, testCases: Array<{ input: string; expected_output: string }>): Promise<CodeResult> {
 const languageId = LANGUAGES[language.toLowerCase()]

 if (!languageId) {
    return { status: 'runtime_error', passed: 0, total: testCases.length };
  }

  let passed = 0;
  let maxTime = 0;

  
}