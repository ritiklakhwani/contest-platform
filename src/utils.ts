import type { Response } from "express";

// Utility functions for sending standardized success and error responses
export const successResponse = (res: Response, data: Object | string, status: number) => {
  res.status(status).json({
    success: true,
    data,
    error: null
  })
};

export const errorResponse = (res: Response, error: Object | string, status: number) => {
  res.status(status).json({
    success: false,
    data: null,
    error: error
  })
}

export const isContestActive = (startTime: Date, endTime: Date): boolean=> {
  const now = new Date();
  return now >= startTime && now <= endTime;
}

