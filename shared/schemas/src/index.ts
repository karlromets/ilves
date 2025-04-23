import { z } from 'zod';

export const codeSchema = z
  .string()
  .length(5, { message: 'Code must be 5 characters long' })
  .regex(/^[a-zA-Z0-9]+$/, 'Only letters and numbers are allowed');

export const claimSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(255, "First name cannot be longer than 255 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(255, "Last name cannot be longer than 255 characters"),
});

export const prizeTierSchema = z.enum(['high', 'medium', 'low']);
export type PrizeTier = z.infer<typeof prizeTierSchema>;

export const submissionRequestSchema = z.object({
  code: codeSchema,
});
export type SubmissionRequest = z.infer<typeof submissionRequestSchema>;

// Submission response schema
export const submissionResponseSchema = z.object({
  win: z.boolean(),
  submissionId: z.number(),
  prizeTier: prizeTierSchema.nullable(),
});
export type SubmissionResponse = z.infer<typeof submissionResponseSchema>;

// Claim response schema
export const claimResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ClaimResponse = z.infer<typeof claimResponseSchema>;

// Leaderboard entry schema
export const leaderboardEntrySchema = z.object({
  initials: z.string(),
  submittedAt: z.string(),
  prizeTier: prizeTierSchema.nullable(),
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

// Submission count schema
export const submissionCountSchema = z.object({
  daily: z.number(),
  weekly: z.number(),
  monthly: z.number(),
  total: z.number(),
});
export type SubmissionCount = z.infer<typeof submissionCountSchema>; 