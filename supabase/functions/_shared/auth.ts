import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function svc(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export async function authStaff(req: Request, requireElevation = false) {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return { error: json({ error: "Unauthorized" }, 401) };
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims) return { error: json({ error: "Unauthorized" }, 401) };
  const userId = data.claims.sub as string;
  const s = svc();
  const { data: roles } = await s.from("user_roles").select("role").eq("user_id", userId);
  const roleSet = new Set((roles ?? []).map((r) => r.role as string));
  const isStaff = ["moderator", "admin", "owner"].some((r) => roleSet.has(r));
  if (!isStaff) return { error: json({ error: "Forbidden" }, 403) };
  const { data: session } = await s.from("staff_sessions")
    .select("*").eq("user_id", userId).is("ended_at", null).maybeSingle();
  if (!session) return { error: json({ error: "No active session" }, 409) };
  if (requireElevation) {
    if (!session.elevated_until || new Date(session.elevated_until) < new Date()) {
      return { error: json({ error: "CD key required" }, 412) };
    }
  }
  return { userId, roles: roleSet, session, svc: s };
}

export async function logAudit(s: SupabaseClient, actor_id: string, action: string, entity_type: string, entity_id?: string, before?: unknown, after?: unknown) {
  await s.from("audit_logs").insert({ actor_id, action, entity_type, entity_id, before, after });
}
