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

    const responseJson = await response.json()

    if (!response.ok) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  },

  async getSubmissionCount(): Promise<SubmissionCount> {
    const response = await fetch(`${API_URL}/submissions/count`);

    const responseJson = await response.json()

    if (!response.ok) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  },

  async submitCode(code: string): Promise<SubmissionResponse> {
    const response = await fetch(`${API_URL}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    const responseJson = await response.json()

    if (!response.ok) {
      throw new Error(responseJson.message);
    }

    return responseJson;
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

    const responseJson = await response.json()

    if (!response.ok) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  },
};
