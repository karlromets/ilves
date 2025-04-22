import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const codesTable = sqliteTable("codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  usedAt: integer("used_at", { mode: "timestamp" }),
  submissionId: integer("submission_id"),
});

export const submissionsTable = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  codeId: integer("code_id").notNull(),
  submittedAt: integer("submitted_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  isWinner: integer("is_winner", { mode: "boolean" }).notNull(),
  prizeId: integer("prize_id"),
  firstName: text("first_name"),
  lastName: text("last_name"),
});

export const prizesTable = sqliteTable("prizes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  availableDate: integer("available_date", { mode: "timestamp" }).notNull(),
  tier: text("tier", { enum: ["high", "medium", "low"] }).notNull(),
  awarded: integer("awarded", { mode: "boolean" }).notNull().default(false),
  awardedAt: integer("awarded_at", { mode: "timestamp" }),
  submissionId: integer("submission_id"),
});

export const codesRelations = relations(codesTable, ({ one }) => ({
  submission: one(submissionsTable, {
    fields: [codesTable.submissionId],
    references: [submissionsTable.id],
  }),
}));

export const submissionsRelations = relations(submissionsTable, ({ one }) => ({
  code: one(codesTable, {
    fields: [submissionsTable.codeId],
    references: [codesTable.id],
  }),
  prize: one(prizesTable, {
    fields: [submissionsTable.prizeId],
    references: [prizesTable.id],
  }),
}));

export const prizesRelations = relations(prizesTable, ({ one }) => ({
  submission: one(submissionsTable, {
    fields: [prizesTable.submissionId],
    references: [submissionsTable.id],
  }),
}));

export type Code = typeof codesTable.$inferSelect;
export type CodeInsert = typeof codesTable.$inferInsert;

export type Submission = typeof submissionsTable.$inferSelect;
export type SubmissionInsert = typeof submissionsTable.$inferInsert;

export type Prize = typeof prizesTable.$inferSelect;
export type PrizeInsert = typeof prizesTable.$inferInsert;
