// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// supabase/functions/ingest-measurement/index.js
import { createClient } from "jsr:@supabase/supabase-js";

const db = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);
const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status, headers: { "Content-Type": "application/json" }
    });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const token = req.headers.get("X-Station-Token");
  const p = await req.json().catch(() => null);
  if (!token || !p?.station_id) return json({ error: "Bad request" }, 400);

  const { data: auth, error: authError } = await db.from("station_tokens")
      .select("active")
      .eq("station_id", p.station_id)
      .eq("token", token).single();
  if (authError) {
    console.error("Station token lookup failed", authError);
    return json({ error: "Invalid token", authError }, 401);
  }
  if (!auth?.active) return json({ error: "Invalid token", auth, p }, 401);

  const t = new Date(p.device_time);
  if (Number.isNaN(t.getTime())) return json({ error: "Invalid time" }, 400);

  const row = {
    station_id: p.station_id, device_time: t.toISOString(),
    noise_dba_raw: p.noise_dba_raw, noise_dba: p.noise_dba_raw,
    pm25_raw: p.pm25_raw, pm25_ugm3: p.pm25_raw,
    pm10_raw: p.pm10_raw, pm10_ugm3: p.pm10_raw,
    temperature_c: p.temperature_c, battery_v: p.battery_v,
    calibration_version: p.calibration_version ?? null, payload: p
  };
  const { error } = await db.from("measurements").insert(row);
  return error ? json({ error: error.message, p }, 400) : json({ ok: true });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/ingest-measurement' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
