import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";


export const codes = sqliteTable("codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  usedAt: integer("used_at", { mode: "timestamp" }),
  submissionId: integer("submission_id"),
});

export const submissions = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  codeId: integer("code_id").notNull(),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  isWinner: integer("is_winner", { mode: "boolean" }).notNull(),
  prizeId: integer("prize_id"),
  firstName: text("first_name"),
  lastName: text("last_name"),
});

export const prizes = sqliteTable("prizes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  tier: text("tier", { enum: ["high", "medium", "low"] }).notNull(),
  awarded: integer("awarded", { mode: "boolean" }).notNull().default(false),
  awardedAt: integer("awarded_at", { mode: "timestamp" }),
  submissionId: integer("submission_id"),
});

export const codesRelations = relations(codes, ({ one }) => ({
  submission: one(submissions, {
    fields: [codes.submissionId],
    references: [submissions.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  code: one(codes, {
    fields: [submissions.codeId],
    references: [codes.id],
  }),
  prize: one(prizes, {
    fields: [submissions.prizeId],
    references: [prizes.id],
  }),
}));

export const prizesRelations = relations(prizes, ({ one }) => ({
  submission: one(submissions, {
    fields: [prizes.submissionId],
    references: [submissions.id],
  }),
}));

export type Code = typeof codes.$inferSelect;
export type CodeInsert = typeof codes.$inferInsert;

export type Submission = typeof submissions.$inferSelect;
export type SubmissionInsert = typeof submissions.$inferInsert;

export type Prize = typeof prizes.$inferSelect;
export type PrizeInsert = typeof prizes.$inferInsert;
