import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      issues: err.issues
    });
  }

  if (err instanceof Error) {
    return res.status(500).json({
      message: err.message
    });
  }

  return res.status(500).json({
    message: "Unknown server error"
  });
};
