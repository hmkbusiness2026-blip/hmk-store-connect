import { authStaff, corsHeaders, json, svc, logAudit } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let body: any = {};
  try { body = await req.json(); } catch { /* */ }
  const op = body.op as string;

  // For start, we don't require an existing session
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const u = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: claims } = await u.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (!claims?.claims) return json({ error: "Unauthorized" }, 401);
  const userId = claims.claims.sub as string;
  const s = svc();
  const { data: roles } = await s.from("user_roles").select("role").eq("user_id", userId);
  const isStaff = (roles ?? []).some((r: any) => ["moderator","admin","owner"].includes(r.role));
  if (!isStaff) return json({ error: "Forbidden" }, 403);

  if (op === "start") {
    const { data: existing } = await s.from("staff_sessions")
      .select("id, last_ping").eq("user_id", userId).is("ended_at", null).maybeSingle();
    if (existing) {
      // If old session is stale (>2 min no ping), close it
      if (new Date(existing.last_ping).getTime() < Date.now() - 120000) {
        await s.from("staff_sessions").update({ ended_at: new Date().toISOString(), ended_reason: "stale" }).eq("id", existing.id);
      } else {
        return json({ error: "Session already active on another device" }, 409);
      }
    }
    const { data: session, error } = await s.from("staff_sessions").insert({
      user_id: userId,
      device_id: body.device_id ?? null,
      user_agent: req.headers.get("User-Agent") ?? null,
      ip: req.headers.get("x-forwarded-for") ?? null,
    }).select("*").single();
    if (error) return json({ error: error.message }, 500);
    await logAudit(s, userId, "session_start", "staff_sessions", session.id);
    return json({ session });
  }

  if (op === "ping") {
    const idle = Boolean(body.idle);
    const { data: updated, error } = await s.from("staff_sessions")
      .update({ last_ping: new Date().toISOString(), is_idle: idle })
      .eq("user_id", userId).is("ended_at", null).select("*").maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!updated) return json({ error: "No active session" }, 409);
    return json({ ok: true, session: updated });
  }

  if (op === "end") {
    // Hard-block clock out without active replacement (moderators only)
    const { data: roleRows } = await s.from("user_roles").select("role").eq("user_id", userId);
    const isModOnly = (roleRows ?? []).every((r: any) => r.role === "moderator");
    if (isModOnly && !body.force) {
      const { count } = await s.from("staff_sessions").select("id", { count: "exact", head: true })
        .is("ended_at", null).neq("user_id", userId);
      if ((count ?? 0) === 0) return json({ error: "No active replacement online" }, 409);
      if (!body.handover_notes || body.handover_notes.length < 5) {
        return json({ error: "Handover notes required" }, 400);
      }
      await s.from("handovers").insert({ from_user: userId, notes: body.handover_notes });
    }
    await s.from("staff_sessions").update({ ended_at: new Date().toISOString(), ended_reason: body.reason ?? "user" })
      .eq("user_id", userId).is("ended_at", null);
    await logAudit(s, userId, "session_end", "staff_sessions");
    return json({ ok: true });
  }

  return json({ error: "Unknown op" }, 400);
});
