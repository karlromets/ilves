import { beforeEach } from "vitest";
import { db, sqlite } from "../db/index.js";
import { prizesTable, submissionsTable, codesTable } from "../db/schema.js";

beforeEach(async () => {
  await db.delete(submissionsTable);
  await db.delete(codesTable);
  await db.delete(prizesTable);
});