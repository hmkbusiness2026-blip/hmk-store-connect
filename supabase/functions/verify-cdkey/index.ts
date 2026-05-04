import { corsHeaders, json, svc, logAudit } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const u = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: claims } = await u.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (!claims?.claims) return json({ error: "Unauthorized" }, 401);
  const userId = claims.claims.sub as string;
  const s = svc();
  const body = await req.json().catch(() => ({}));
  const op = body.op as string;

  if (op === "issue") {
    // owner only
    const { data: rs } = await s.from("user_roles").select("role").eq("user_id", userId);
    if (!(rs ?? []).some((r: any) => r.role === "owner")) return json({ error: "Forbidden" }, 403);
    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
    const hash = await sha256Hex(code);
    const { data: row, error } = await s.from("staff_cd_keys").insert({
      code_hash: hash,
      label: body.label ?? null,
      assigned_to: body.assigned_to ?? null,
      created_by: userId,
      expires_at: body.expires_at ?? null,
    }).select("id, label, assigned_to, expires_at").single();
    if (error) return json({ error: error.message }, 500);
    await logAudit(s, userId, "cdkey_issue", "staff_cd_keys", row.id, null, { label: row.label, assigned_to: row.assigned_to });
    return json({ key: code, ...row });
  }

  if (op === "redeem") {
    const code = String(body.code ?? "").trim().toUpperCase();
    if (!code) return json({ error: "Code required" }, 400);
    const hash = await sha256Hex(code);
    const { data: key } = await s.from("staff_cd_keys").select("*").eq("code_hash", hash).maybeSingle();
    if (!key || key.used_at || key.archived_at) return json({ error: "Invalid key" }, 400);
    if (key.expires_at && new Date(key.expires_at) < new Date()) return json({ error: "Expired" }, 400);
    if (key.assigned_to && key.assigned_to !== userId) return json({ error: "Key not for this user" }, 403);
    await s.from("staff_cd_keys").update({ used_at: new Date().toISOString(), used_by: userId }).eq("id", key.id);
    const elevated_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await s.from("staff_sessions").update({ elevated_until })
      .eq("user_id", userId).is("ended_at", null);
    await logAudit(s, userId, "cdkey_redeem", "staff_cd_keys", key.id);
    return json({ ok: true, elevated_until });
  }

  return json({ error: "Unknown op" }, 400);
});
