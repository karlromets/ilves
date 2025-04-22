import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import * as cronService from "./cron-service.js";
import {
  generateDailyPrizes,
  schedulePrizeGeneration,
} from "./cron-service.js";
import { prizesTable } from "../db/schema.js";
import { db } from "../db/index.js";
import cron from "node-cron";

// Mock node-cron
vi.mock("node-cron", () => {
  const mockScheduleFn = vi.fn().mockImplementation((pattern, callback) => {
    return { start: vi.fn() };
  });

  return {
    default: {
      schedule: mockScheduleFn,
      validate: vi.fn(() => true), // Default to true for most tests
    },
  };
});

describe("Cron Service", () => {
  const originalSchedule = process.env.PRIZE_GENERATION_SCHEDULE;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Make sure we keep the environment variable from setup.ts
    process.env.PRIZE_GENERATION_SCHEDULE = originalSchedule;
    // Clean up the database before each test
    await db.delete(prizesTable);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("should generate daily prizes", async () => {
    const consoleSpy = vi.spyOn(console, "log");

    await generateDailyPrizes();

    const prizesFromDb = await db.select().from(prizesTable);

    // We should have 6 prizes (1 high + 2 medium + 3 low)
    expect(prizesFromDb).toHaveLength(6);

    // Check prize distribution
    const highTierPrizes = prizesFromDb.filter((p) => p.tier === "high");
    const mediumTierPrizes = prizesFromDb.filter((p) => p.tier === "medium");
    const lowTierPrizes = prizesFromDb.filter((p) => p.tier === "low");

    expect(highTierPrizes).toHaveLength(1);
    expect(mediumTierPrizes).toHaveLength(2);
    expect(lowTierPrizes).toHaveLength(3);

    // Check that all prizes are not awarded yet
    expect(prizesFromDb.every((p) => p.awarded === false)).toBe(true);

    // Check log output
    expect(consoleSpy).toHaveBeenCalledWith(
      "Running daily prize generation job..."
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Successfully inserted 6 prizes for")
    );
  });

  test("should handle error during prize generation", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error");
    const dbInsertSpy = vi.spyOn(db, "insert").mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    await generateDailyPrizes();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to insert daily prizes:",
      expect.any(Error)
    );

    dbInsertSpy.mockRestore();
  });

  test("should schedule prize generation with valid cron pattern", async () => {
    // Pre-setup in test setup file sets PRIZE_GENERATION_SCHEDULE to '0 12 * * *'
    schedulePrizeGeneration();

    // Check if cron was scheduled with the right pattern
    expect(cron.schedule).toHaveBeenCalledWith(
      "0 12 * * *",
      expect.any(Function),
      expect.objectContaining({ timezone: "UTC" })
    );

    // Execute the callback that was passed to cron.schedule
    // This simulates what happens when the scheduled job runs
    const mockCronCallback = vi.mocked(cron.schedule).mock.calls[0][1];
    // @ts-expect-error: This is a mock
    await mockCronCallback();

    // Check that prizes were generated
    const prizesFromDb = await db.select().from(prizesTable);
    expect(prizesFromDb).toHaveLength(6);
  });

  test("should use default schedule when invalid cron pattern provided", async () => {
    // Override the validate function to return false for this test
    vi.mocked(cron.validate).mockReturnValueOnce(false);

    // Set an invalid pattern
    process.env.PRIZE_GENERATION_SCHEDULE = "invalid-pattern";

    const consoleErrorSpy = vi.spyOn(console, "error");

    schedulePrizeGeneration();

    // Check if error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid PRIZE_GENERATION_SCHEDULE")
    );

    // Check if cron was scheduled with the default pattern
    expect(cron.schedule).toHaveBeenCalledWith(
      "0 0 * * *",
      expect.any(Function),
      expect.objectContaining({ timezone: "UTC" })
    );

    // Execute the callback that was passed to cron.schedule
    // This simulates what happens when the scheduled job runs
    const mockCronCallback = vi.mocked(cron.schedule).mock.calls[0][1];
    // @ts-expect-error: This is a mock
    await mockCronCallback();

    // Check that prizes were generated
    const prizesFromDb = await db.select().from(prizesTable);
    expect(prizesFromDb).toHaveLength(6);
  });
});
