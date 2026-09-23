import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

// Preview/test adapter only. Production D1 migrations are applied by Sites.
export function createLocalUsageDB(filename = ":memory:") {
  const database = new DatabaseSync(filename);
  database.exec(
    "CREATE TABLE IF NOT EXISTS _preview_migrations (name TEXT PRIMARY KEY)",
  );
  const journal = JSON.parse(
    readFileSync(
      new URL("../drizzle/meta/_journal.json", import.meta.url),
      "utf8",
    ),
  );
  for (const migration of journal.entries) {
    if (
      database
        .prepare("SELECT name FROM _preview_migrations WHERE name = ?")
        .get(migration.tag)
    )
      continue;
    database.exec(
      readFileSync(
        new URL(`../drizzle/${migration.tag}.sql`, import.meta.url),
        "utf8",
      ),
    );
    database
      .prepare("INSERT INTO _preview_migrations(name) VALUES (?)")
      .run(migration.tag);
  }
  return {
    database,
    prepare(sql) {
      return {
        bind(...values) {
          return { sql, values };
        },
      };
    },
    async batch(statements) {
      database.exec("BEGIN");
      try {
        const results = statements.map(({ sql, values }) =>
          database.prepare(sql).run(...values),
        );
        database.exec("COMMIT");
        return results;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  };
}
