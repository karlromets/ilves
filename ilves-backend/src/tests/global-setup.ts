import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { sqlite } from "../db/index.js"; // Import sqlite connection

const TEST_DB_PATH = path.join(__dirname, "../../test-db.sqlite");
const MIGRATIONS_FOLDER = path.join(__dirname, "../../drizzle");

export default async function setup() {
  console.log("Running global test setup...");

  process.env.DATABASE_URL = TEST_DB_PATH;
  process.env.NODE_ENV = "test";
  process.env.PRIZE_GENERATION_SCHEDULE = "0 12 * * *";

  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
    console.log("Deleted existing test database before migration.");
  }

  console.log("Applying migrations to test database (once)...");
  try {
    execSync(
      `DATABASE_URL=${TEST_DB_PATH} pnpm exec drizzle-kit push --config=./drizzle.config.ts`,
      { stdio: "inherit", cwd: path.join(__dirname, "../../") }
    );
    console.log("Migrations applied successfully.");
  } catch (error) {
    console.error("Failed to apply migrations during global setup:", error);
    process.exit(1);
  }

  return async () => {
    console.log("Running global test teardown...");
    sqlite.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
      console.log("Deleted test database.");
    }
  };
}
