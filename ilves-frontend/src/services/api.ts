import {
  LeaderboardEntry,
  SubmissionCount,
  SubmissionResponse,
  ClaimResponse,
} from "../types";

const API_URL = "/api";

export const apiService = {
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const response = await fetch(`${API_URL}/submissions/leaderboard`);

    if (!response.ok) {
      throw new Error("Failed to fetch leaderboard");
    }

    return response.json();
  },

  async getSubmissionCount(): Promise<SubmissionCount> {
    const response = await fetch(`${API_URL}/submissions/count`);

    if (!response.ok) {
      throw new Error("Failed to fetch submission count");
    }

    return response.json();
  },

  async submitCode(code: string): Promise<SubmissionResponse> {
    const response = await fetch(`${API_URL}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error("Failed to submit code");
    }

    return response.json();
  },

  async claimPrize(
    submissionId: number,
    firstName: string,
    lastName: string
  ): Promise<ClaimResponse> {
    const response = await fetch(
      `${API_URL}/submissions/${submissionId}/details`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstName, lastName }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to claim prize");
    }

    return response.json();
  },
};
