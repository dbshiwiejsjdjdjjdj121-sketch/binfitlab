import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.js";
import { createLocalUsageDB } from "../scripts/local-usage-db.mjs";

const event = {
  event: "generation",
  tool: "bin",
  outcome: "success",
  reason: "none",
  duration: "1_3s",
};
function request(data = event, headers = {}) {
  return new Request("https://binfitlab.com/api/usage", {
    method: "POST",
    headers: {
      Origin: "https://binfitlab.com",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(data),
  });
}
test("usage endpoint aggregates real SQLite rows and removes expired counters", async () => {
  const DB = createLocalUsageDB();
  DB.database
    .prepare("INSERT INTO usage_daily VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run("2000-01-01", "generation", "bin", "success", "none", "1_3s", 100);
  assert.equal((await worker.fetch(request(), { DB })).status, 204);
  assert.equal((await worker.fetch(request(), { DB })).status, 204);
  const rows = DB.database.prepare("SELECT * FROM usage_daily").all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].count, 2);
  assert.deepEqual(Object.keys(rows[0]).sort(), [
    "count",
    "day",
    "duration",
    "event",
    "outcome",
    "reason",
    "tool",
  ]);
  DB.database.close();
});
test("usage endpoint rejects personal fields, invalid enums, oversized and foreign requests", async () => {
  const DB = createLocalUsageDB();
  for (const bad of [
    { ...event, dimensions: [42, 42] },
    { ...event, ip: "127.0.0.1" },
    { ...event, duration: 2400 },
    { ...event, outcome: "printed" },
    { ...event, reason: "raw error" },
  ])
    assert.equal((await worker.fetch(request(bad), { DB })).status, 400);
  assert.equal(
    (
      await worker.fetch(
        request(event, { Origin: "https://unrelated.example" }),
        { DB },
      )
    ).status,
    403,
  );
  assert.equal(
    (await worker.fetch(request({ data: "x".repeat(600) }), { DB })).status,
    413,
  );
  assert.equal(
    (await worker.fetch(new Request("https://binfitlab.com/api/usage"), { DB }))
      .status,
    405,
  );
  assert.equal(
    DB.database.prepare("SELECT COUNT(*) AS n FROM usage_daily").get().n,
    0,
  );
  DB.database.close();
});
test("privacy signals suppress counters; storage failure has a bounded failure response", async () => {
  const DB = createLocalUsageDB();
  for (const headers of [{ DNT: "1" }, { "Sec-GPC": "1" }])
    assert.equal(
      (await worker.fetch(request(event, headers), { DB })).status,
      204,
    );
  assert.equal(
    DB.database.prepare("SELECT COUNT(*) AS n FROM usage_daily").get().n,
    0,
  );
  assert.equal((await worker.fetch(request(), {})).status, 503);
  DB.database.close();
});
test("worker serves static pages and preserves custom 404 without exposing statistics", async () => {
  const env = {
    ASSETS: {
      async fetch(req) {
        return new Response(
          new URL(req.url).pathname === "/404.html"
            ? "Custom missing page"
            : "Not found",
          { status: 404 },
        );
      },
    },
  };
  const result = await worker.fetch(
    new Request("https://binfitlab.com/missing/"),
    env,
  );
  assert.equal(result.status, 404);
  assert.equal(await result.text(), "Custom missing page");
  assert.equal(
    (
      await worker.fetch(
        new Request("https://binfitlab.com/api/usage/report"),
        env,
      )
    ).status,
    404,
  );
});
