import { z } from 'zod';

export const codeSchema = z.string().length(5).regex(/^[a-zA-Z0-9]+$/, 'Only letters and numbers are allowed');
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

export type LeaderboardEntry = {
  initials: string;
  submittedAt: string;
  prizeTier: 'high' | 'medium' | 'low';
};

export type SubmissionCount = {
  daily: number;
  weekly: number;
  monthly: number;
  total: number;
};

export type SubmissionResponse = {
  win: boolean;
  submissionId: number;
  prizeTier: 'high' | 'medium' | 'low';
};

export type ClaimResponse = {
  success: boolean;
  message: string;
}; 