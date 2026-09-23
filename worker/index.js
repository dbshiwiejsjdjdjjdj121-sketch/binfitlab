const tools = new Set(["bin", "plate", "drawer"]);
const durations = new Set([
  "under_1s",
  "1_3s",
  "3_10s",
  "10_30s",
  "30_90s",
  "90s_plus",
]);
const reasons = new Set(["none", "engine", "mesh", "runtime", "timeout"]);
const origins = new Set([
  "https://binfitlab.com",
  "https://binfitlab.dbshiwiejsjdjdjjdj12.chatgpt.site",
]);
const response = (status) =>
  new Response(null, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

function validEvent(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const keys = Object.keys(data).sort().join(",");
  if (keys !== "duration,event,outcome,reason,tool" || !tools.has(data.tool))
    return false;
  if (data.event === "download")
    return (
      data.outcome === "started" &&
      data.reason === "none" &&
      data.duration === "not_applicable"
    );
  if (
    data.event !== "generation" ||
    !durations.has(data.duration) ||
    !reasons.has(data.reason)
  )
    return false;
  if (data.outcome === "success" || data.outcome === "cancelled")
    return data.reason === "none";
  if (data.outcome === "timeout") return data.reason === "timeout";
  return (
    data.outcome === "error" &&
    ["engine", "mesh", "runtime"].includes(data.reason)
  );
}

async function usage(request, env) {
  if (request.method !== "POST") return response(405);
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  const local =
    ["127.0.0.1", "localhost"].includes(url.hostname) && origin === url.origin;
  if (!origins.has(origin) && !local) return response(403);
  if (
    request.headers.get("Sec-GPC") === "1" ||
    request.headers.get("DNT") === "1"
  )
    return response(204);
  if (
    url.search ||
    !request.headers.get("Content-Type")?.startsWith("application/json")
  )
    return response(400);
  if (Number(request.headers.get("Content-Length")) > 512) return response(413);
  let data;
  try {
    const reader = request.body?.getReader();
    if (!reader) return response(400);
    let text = "",
      size = 0;
    const decoder = new TextDecoder();
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 512) {
        await reader.cancel();
        return response(413);
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    data = JSON.parse(text + decoder.decode());
  } catch {
    return response(400);
  }
  if (!validEvent(data)) return response(400);
  if (!env.DB) return response(503);
  try {
    const today = new Date().toISOString().slice(0, 10);
    const oldest = new Date(Date.now() - 89 * 86400000)
      .toISOString()
      .slice(0, 10);
    // Only a daily counter survives. Never read or store IP, user-agent, cookies,
    // referrer, project parameters, raw error strings or per-visitor identifiers.
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO usage_daily (day, event, tool, outcome, reason, duration, count)
        VALUES (?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(day, event, tool, outcome, reason, duration)
        DO UPDATE SET count = MIN(usage_daily.count + 1, 1000000)`,
      ).bind(
        today,
        data.event,
        data.tool,
        data.outcome,
        data.reason,
        data.duration,
      ),
      env.DB.prepare("DELETE FROM usage_daily WHERE day < ?").bind(oldest),
    ]);
    return response(204);
  } catch {
    console.error("Usage counter storage unavailable");
    return response(503);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/usage") return usage(request, env);
    if (url.pathname.startsWith("/api/")) return response(404);
    if (!["GET", "HEAD"].includes(request.method)) return response(405);
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;
    const missing = await env.ASSETS.fetch(
      new Request(new URL("/404.html", url), request),
    );
    return new Response(request.method === "HEAD" ? null : missing.body, {
      status: 404,
      headers: missing.headers,
    });
  },
};
