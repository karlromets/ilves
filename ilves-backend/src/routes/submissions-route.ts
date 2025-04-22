import { Hono } from "hono";
import { db } from "../db/index.js";
import {
  codesTable,
  prizesTable,
  submissionsTable,
  type Prize,
} from "../db/schema.js";
import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import "dotenv/config";

const submissionsRoute = new Hono();

submissionsRoute.get("/", async (c) => {
  const submissions = await db.select().from(submissionsTable);
  return c.json(submissions);
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
      // 1. Check if code has ALREADY been submitted
      const existingCodeRecord = tx
        .select({ id: codesTable.id })
        .from(codesTable)
        .where(eq(codesTable.code, code))
        .get();

      if (existingCodeRecord) {
        throw new Error("Code already used");
      }

      let submissionId: number;
      let prizeId: number | null = null;
      let isWinner = false;
      let prizeTier: Prize["tier"] | null = null;

      // 2. Determine Win/Loss and Tier
      prizeTier = determinePrizeTier();

      // 3. Insert the newly submitted code record
      const [newCode] = await tx
        .insert(codesTable)
        .values({
          code: code,
          used: true,
          usedAt: now,
        })
        .returning({ insertedId: codesTable.id });

      if (!newCode?.insertedId) throw new Error("Failed to insert code record");
      const codeId = newCode.insertedId;

      // 4. Handle Winner Case
      if (prizeTier !== null) {
        isWinner = true;

        const [newPrize] = await tx
          .insert(prizesTable)
          .values({
            tier: prizeTier,
            awarded: false,
            availableDate: now,
          })
          .returning({ insertedId: prizesTable.id });

        if (!newPrize?.insertedId)
          throw new Error("Failed to create prize record");
        prizeId = newPrize.insertedId;
      }

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

      if (!newSubmission?.insertedId)
        throw new Error("Failed to insert submission");
      submissionId = newSubmission.insertedId;

      // 6. Update Code Record with Submission ID
      await tx
        .update(codesTable)
        .set({ submissionId: submissionId })
        .where(eq(codesTable.id, codeId));

      // 7. If it was a win, update the prize record to link to the submission
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
          prizeTier: prizeTier,
        };
      } else {
        return { win: false, submissionId: submissionId };
      }
    });

    return c.json(result, 200);
  } catch (error: any) {
    if (error?.message === "Code already used") {
      return c.json({ message: "Code already used" }, 400);
    }
    console.error("Submission failed:", error);
    return c.json({ message: "An unexpected error occurred" }, 500);
  }
});

export default submissionsRoute;
