import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const usageDaily = sqliteTable(
  "usage_daily",
  {
    day: text("day").notNull(),
    event: text("event").notNull(),
    tool: text("tool").notNull(),
    outcome: text("outcome").notNull(),
    reason: text("reason").notNull(),
    duration: text("duration").notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [
    primaryKey({
      columns: [
        table.day,
        table.event,
        table.tool,
        table.outcome,
        table.reason,
        table.duration,
      ],
    }),
  ],
);
