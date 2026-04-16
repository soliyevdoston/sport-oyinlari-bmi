import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
  favoriteSport: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
