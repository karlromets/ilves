import { Hono } from "hono";
import { db } from "../db/index.js";
import {
  codesTable,
  prizesTable,
  submissionsTable,
  type Prize,
} from "../db/schema.js";
import { eq, and, asc, sql, gte, desc, inArray, not } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import "dotenv/config";

const submissionsRoute = new Hono();

submissionsRoute.get("/count", async (c) => {
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const submissionsToday = await db
    .select()
    .from(submissionsTable)
    .where(gte(submissionsTable.submittedAt, startOfToday));

  const submissionsThisWeek = await db
    .select()
    .from(submissionsTable)
    .where(gte(submissionsTable.submittedAt, startOfWeek));

  const submissionsThisMonth = await db
    .select()
    .from(submissionsTable)
    .where(gte(submissionsTable.submittedAt, startOfMonth));

  const totalSubmissions = await db.select().from(submissionsTable);

  const stats = {
    daily: submissionsToday.length,
    weekly: submissionsThisWeek.length,
    monthly: submissionsThisMonth.length,
    total: totalSubmissions.length,
  };

  return c.json(stats);
});

submissionsRoute.get("/leaderboard", async (c) => {
  const leaderboard = await db
    .select({
      id: submissionsTable.id,
      firstName: submissionsTable.firstName,
      lastName: submissionsTable.lastName,
      submittedAt: submissionsTable.submittedAt,
      prizeId: submissionsTable.prizeId,
    })
    .from(submissionsTable)
    .where(
      and(
        eq(submissionsTable.isWinner, true),
        not(eq(submissionsTable.firstName, '')),
        not(eq(submissionsTable.lastName, ''))
      )
    )
    .orderBy(desc(submissionsTable.submittedAt));

  const prizeIds = leaderboard
    .map((submission) => submission.prizeId)
    .filter((id): id is number => id !== null);

  if (prizeIds.length === 0) {
    return c.json([]);
  }

  const prizes = await db
    .select({
      id: prizesTable.id,
      tier: prizesTable.tier,
    })
    .from(prizesTable)
    .where(inArray(prizesTable.id, prizeIds));

  const prizeMap = new Map(prizes.map((p) => [p.id, p.tier]));

  let leaderboardWithTiers = leaderboard.map((sub) => {
    // First or last name might be multiple words, so we need to split them and take the first letter of each word
    const firstNameInitials = sub.firstName?.split(' ').map(name => name[0]).join('') || '';
    const lastNameInitials = sub.lastName?.split(' ').map(name => name[0]).join('') || '';

    const initials = firstNameInitials + lastNameInitials;
    const prizeTier = sub.prizeId ? prizeMap.get(sub.prizeId) : null;
    return {
      initials,
      submittedAt: sub.submittedAt,
      prizeTier,
    };
  });

  return c.json(leaderboardWithTiers);
});

const submissionSchema = z.object({
  code: z
    .string()
    .regex(/^[a-zA-Z0-9]{5}$/, "Code must be 5 alphanumeric characters"),
});

function determinePrizeTier(): Prize["tier"] | null {
  const highProb = parseFloat(process.env.HIGH_WIN_PROBABILITY || "0.0001");
  const medProb = parseFloat(process.env.MED_WIN_PROBABILITY || "0.0002");
  const lowProb = parseFloat(process.env.LOW_WIN_PROBABILITY || "0.0003");

  const totalWinProbability = highProb + medProb + lowProb;
  const medThreshold = highProb + medProb;

  const rand = Math.random();

  if (rand >= totalWinProbability) {
    return null;
  }

  if (rand < highProb) return "high";
  if (rand < medThreshold) return "medium";
  return "low";
}

submissionsRoute.post("/", zValidator("json", submissionSchema), async (c) => {
  const { code } = c.req.valid("json");
  const now = new Date();

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Check if code STRING exists in the codes table AT ALL
      const existingCodeRecord = tx
        .select({ id: codesTable.id, used: codesTable.used })
        .from(codesTable)
        .where(eq(codesTable.code, code))
        .get();

      if (existingCodeRecord?.used) {
        throw new Error("Code already used");
      }

      // If code exists but is not used, it means it's a pending win.
      // For simplicity, let's prevent resubmission for now.
      if (existingCodeRecord) {
        throw new Error("Code already submitted and pending claim");
      }

      // 2. Check Prize Availability
      const availablePrizeCount =
        tx
          .select({ count: sql<number>`count(*)` })
          .from(prizesTable)
          .where(eq(prizesTable.awarded, false))
          .get()?.count ?? 0;

      let isWinner = false;
      let determinedTier: Prize["tier"] | null = null;
      let prizeId: number | null = null;
      let actualTierWon: Prize["tier"] | null = null;

      // 3. Determine Win/Loss (only if prizes might exist)
      if (availablePrizeCount > 0) {
        determinedTier = determinePrizeTier(); // Roll the dice

        if (determinedTier !== null) {
          // Potential Win - Try to find an available prize matching the tier or lower
          const tiersToTry: Prize["tier"][] = [];
          if (determinedTier === "high")
            tiersToTry.push("high", "medium", "low");
          else if (determinedTier === "medium")
            tiersToTry.push("medium", "low");
          else if (determinedTier === "low") tiersToTry.push("low");

          let foundPrize: { id: number; tier: Prize["tier"] } | undefined;
          for (const tier of tiersToTry) {
            foundPrize = tx
              .select({ id: prizesTable.id, tier: prizesTable.tier })
              .from(prizesTable)
              .where(
                and(eq(prizesTable.awarded, false), eq(prizesTable.tier, tier))
              )
              .orderBy(asc(prizesTable.availableDate))
              .limit(1)
              .get();
            if (foundPrize) break;
          }

          if (foundPrize) {
            isWinner = true;
            prizeId = foundPrize.id;
            actualTierWon = foundPrize.tier;
          }
        }
      }

      // 3. Insert the newly submitted code record
      const [newCode] = await tx
        .insert(codesTable)
        .values({
          code: code,
          used: !isWinner, // Mark as used ONLY if it's a loss
          usedAt: !isWinner ? now : null, // Set usedAt ONLY if it's a loss
          // submissionId will be set later
        })
        .returning({ insertedId: codesTable.id });

      if (!newCode?.insertedId) throw new Error("Failed to insert code record");
      const codeId = newCode.insertedId;

      // 5. Insert Submission Record (always)
      const [newSubmission] = await tx
        .insert(submissionsTable)
        .values({
          codeId: codeId,
          isWinner: isWinner,
          prizeId: prizeId,
          submittedAt: now,
        })
        .returning({ insertedId: submissionsTable.id });

      if (!newSubmission?.insertedId) {
        throw new Error("Failed to insert submission");
      }
      const submissionId = newSubmission.insertedId;

      // 6. Update Code Record with Submission ID
      await tx
        .update(codesTable)
        .set({ submissionId: submissionId })
        .where(eq(codesTable.id, codeId));

      // 7. Update Prize Record with Submission ID (IF Winner) - DO NOT mark awarded
      // This links the prize for the claim step.
      if (isWinner && prizeId !== null) {
        await tx
          .update(prizesTable)
          .set({ submissionId: submissionId })
          .where(eq(prizesTable.id, prizeId));
      }

      // 8. Return Result from transaction
      if (isWinner) {
        return {
          win: true,
          submissionId: submissionId,
          prizeTier: actualTierWon,
        };
      } else {
        return { win: false, submissionId: submissionId };
      }
    });

    return c.json(result, 200);
  } catch (error: any) {
    if (error.message === "Code already used") {
      return c.json({ message: "Code already used" }, 400);
    }
    if (error.message === "Code already submitted and pending claim") {
      return c.json(
        { message: "Code already submitted and pending claim" },
        409
      );
    }

    console.error("Submission failed:", error);
    if (
      error.message === "Failed to insert code record" ||
      error.message === "Failed to insert submission"
    ) {
      return c.json(
        { message: "Submission failed due to database error." },
        500
      );
    }
    return c.json(
      { message: "An unexpected error occurred during submission." },
      500
    );
  }
});

const claimSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name cannot be empty")
    .max(255, "First name cannot be longer than 255 characters"),
  lastName: z
    .string()
    .min(1, "Last name cannot be empty")
    .max(255, "Last name cannot be longer than 255 characters"),
});

submissionsRoute.patch(
  "/:submissionId/details",
  zValidator("param", z.object({ submissionId: z.string() })),
  zValidator("json", claimSchema),
  async (c) => {
    const { submissionId: submissionIdStr } = c.req.valid("param");
    const { firstName, lastName } = c.req.valid("json");
    const submissionId = parseInt(submissionIdStr, 10);
    const now = new Date();

    if (isNaN(submissionId)) {
      return c.json({ message: "Invalid submission ID format" }, 400);
    }

    try {
      const result = await db.transaction(async (tx) => {
        // 1. Find the submission and related data
        const submission = await tx.query.submissionsTable.findFirst({
          where: eq(submissionsTable.id, submissionId),
          with: { code: true, prize: true },
        });

        // 2. Validations - Throw specific errors
        if (!submission) {
          throw new Error("Submission not found");
        }
        if (!submission.isWinner) {
          throw new Error("Submission is not a winner");
        }
        if (!submission.prize) {
          console.error(
            `Data inconsistency: Winner submission ${submissionId} has no prize linked.`
          );
          throw new Error("Prize details not found for this submission");
        }
        if (submission.prize.awarded) {
          throw new Error("Prize already claimed");
        }
        if (!submission.code) {
          console.error(
            `Data inconsistency: Submission ${submissionId} has no code linked.`
          );
          throw new Error("Code details not found for this submission");
        }
        if (submission.code.used) {
          console.warn(
            `Claim attempt on already used code ${submission.code.id} for submission ${submissionId}. Prize awarded status: ${submission.prize.awarded}`
          );
          throw new Error("Code already marked as used");
        }

        const prizeId = submission.prizeId;
        const codeId = submission.codeId;

        if (!prizeId || !codeId) {
          console.error(
            `Data inconsistency: Missing prizeId or codeId for submission ${submissionId}`
          );
          throw new Error("Data inconsistency detected");
        }

        // 3. Update Submission with details
        await tx
          .update(submissionsTable)
          .set({
            firstName: firstName,
            lastName: lastName,
          })
          .where(eq(submissionsTable.id, submissionId));

        // 4. Update Prize to awarded
        await tx
          .update(prizesTable)
          .set({
            awarded: true,
            awardedAt: now,
          })
          .where(eq(prizesTable.id, prizeId));

        // 5. Update Code to used
        await tx
          .update(codesTable)
          .set({
            used: true,
            usedAt: now,
          })
          .where(eq(codesTable.id, codeId));

        return { success: true, message: "Prize claimed successfully" };
      });

      return c.json(result, 200);
    } catch (error: any) {
      if (error.message === "Submission not found") {
        return c.json({ message: error.message }, 404);
      }
      if (error.message === "Submission is not a winner") {
        return c.json({ message: error.message }, 400);
      }
      if (
        error.message === "Prize already claimed" ||
        error.message === "Code already marked as used"
      ) {
        return c.json({ message: "This prize has already been claimed." }, 409);
      }

      console.error(`Claim failed for submission ${submissionId}:`, error);
      if (
        error.message === "Prize details not found for this submission" ||
        error.message === "Code details not found for this submission" ||
        error.message === "Data inconsistency detected"
      ) {
        return c.json(
          {
            message:
              "An internal server error occurred while processing the claim.",
          },
          500
        );
      }
      return c.json(
        { message: "Failed to claim prize due to an unexpected server error." },
        500
      );
    }
  }
);

export default submissionsRoute;
