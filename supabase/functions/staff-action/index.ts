import { authStaff, corsHeaders, json, logAudit } from "../_shared/auth.ts";

const ELEVATED_ACTIONS = new Set([
  "order_refund", "order_purge", "role_assign", "cdkey_issue", "site_config_purge",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const ids: string[] = Array.isArray(body.ids) ? body.ids : (body.id ? [body.id] : []);
  const payload = body.payload ?? {};

  const auth = await authStaff(req, ELEVATED_ACTIONS.has(action));
  if ("error" in auth) return auth.error;
  const { userId, roles, svc: s } = auth;

  const adminLevel = roles.has("admin") || roles.has("owner");
  const owner = roles.has("owner");

  async function fetchOrders() {
    const { data } = await s.from("orders").select("*").in("id", ids);
    return data ?? [];
  }

  switch (action) {
    case "order_approve": {
      const before = await fetchOrders();
      for (const o of before) {
        await s.from("orders").update({ status: "approved", admin_name: payload.admin_name ?? null }).eq("id", o.id);
        // Add diamonds via existing RPC if MLBB-style purchase
        await s.rpc("add_diamonds", { p_user_id: o.user_id, p_diamonds: payload.diamonds_map?.[o.id] ?? 0 }).catch(() => {});
        await s.from("notifications").insert({ user_id: o.user_id, title: "Order approved", message: `Your order for ${o.package_name} was approved.` });
        await logAudit(s, userId, "order_approve", "orders", o.id, o, { ...o, status: "approved" });
      }
      return json({ ok: true, count: before.length });
    }
    case "order_reject": {
      const before = await fetchOrders();
      for (const o of before) {
        await s.from("orders").update({ status: "rejected", admin_name: payload.admin_name ?? null }).eq("id", o.id);
        await s.from("notifications").insert({ user_id: o.user_id, title: "Order rejected", message: payload.reason ?? "Your order was rejected." });
        await logAudit(s, userId, "order_reject", "orders", o.id, o, { ...o, status: "rejected" });
      }
      return json({ ok: true, count: before.length });
    }
    case "order_cancel_restock": {
      const before = await fetchOrders();
      for (const o of before) {
        await s.from("orders").update({ status: "cancelled" }).eq("id", o.id);
        await s.rpc("inventory_adjust", { p_game_id: o.game_id, p_package: o.package_name, p_delta: 1 }).catch(() => {});
        await s.from("notifications").insert({ user_id: o.user_id, title: "Order cancelled", message: `Your order for ${o.package_name} was cancelled and refunded.` });
        await logAudit(s, userId, "order_cancel_restock", "orders", o.id, o, { ...o, status: "cancelled" });
      }
      return json({ ok: true, count: before.length });
    }
    case "order_archive": {
      const before = await fetchOrders();
      for (const o of before) {
        await s.from("orders").update({ archived_at: new Date().toISOString() }).eq("id", o.id);
        await logAudit(s, userId, "order_archive", "orders", o.id, o);
      }
      return json({ ok: true });
    }
    case "order_restore": {
      for (const id of ids) {
        await s.from("orders").update({ archived_at: null }).eq("id", id);
        await logAudit(s, userId, "order_restore", "orders", id);
      }
      return json({ ok: true });
    }
    case "order_refund": {
      const before = await fetchOrders();
      for (const o of before) {
        await s.from("orders").update({ status: "refunded" }).eq("id", o.id);
        await s.from("notifications").insert({ user_id: o.user_id, title: "Refund issued", message: `Your refund for ${o.package_name} was processed.` });
        await logAudit(s, userId, "order_refund", "orders", o.id, o, { ...o, status: "refunded" });
      }
      return json({ ok: true });
    }
    case "role_assign": {
      if (!owner) return json({ error: "Owner only" }, 403);
      const target_user_id = payload.user_id;
      const role = payload.role;
      if (!["client", "moderator", "admin", "owner"].includes(role)) return json({ error: "Invalid role" }, 400);
      await s.from("user_roles").delete().eq("user_id", target_user_id);
      await s.from("user_roles").insert({ user_id: target_user_id, role });
      await logAudit(s, userId, "role_assign", "user_roles", target_user_id, null, { role });
      return json({ ok: true });
    }
    case "store_status_set": {
      if (!adminLevel) return json({ error: "Admin only" }, 403);
      const { data: existing } = await s.from("store_status").select("id").limit(1).maybeSingle();
      if (existing) {
        await s.from("store_status").update({ is_open: !!payload.is_open, admin_name: payload.admin_name ?? null }).eq("id", existing.id);
      } else {
        await s.from("store_status").insert({ is_open: !!payload.is_open, admin_name: payload.admin_name ?? null });
      }
      await logAudit(s, userId, "store_status_set", "store_status", null, null, payload);
      return json({ ok: true });
    }
    case "inventory_set": {
      const { game_id, package_name, stock, low_threshold } = payload;
      const { data: existing } = await s.from("inventory").select("id").eq("game_id", game_id).eq("package_name", package_name).maybeSingle();
      if (existing) {
        await s.from("inventory").update({ stock, low_threshold, updated_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await s.from("inventory").insert({ game_id, package_name, stock, low_threshold });
      }
      await logAudit(s, userId, "inventory_set", "inventory", null, null, payload);
      return json({ ok: true });
    }
    case "handover_ack": {
      await s.from("handovers").update({ acknowledged_at: new Date().toISOString(), to_user: userId }).in("id", ids);
      return json({ ok: true });
    }
    case "message_assign": {
      await s.from("messages").update({ assigned_to: payload.assigned_to ?? userId, status: "open" }).in("id", ids);
      return json({ ok: true });
    }
    case "message_close": {
      await s.from("messages").update({ status: "closed" }).in("id", ids);
      return json({ ok: true });
    }
    case "message_reply": {
      await s.from("messages").insert({
        customer_id: payload.customer_id,
        order_id: payload.order_id ?? null,
        body: payload.body,
        direction: "outbound",
        channel: "app",
        status: "open",
        assigned_to: userId,
      });
      return json({ ok: true });
    }
    case "order_note_add": {
      const note = await s.from("order_notes").insert({
        order_id: payload.order_id,
        author_id: userId,
        body: payload.body,
        mentions: payload.mentions ?? [],
      }).select("*").single();
      for (const m of (payload.mentions ?? [])) {
        await s.from("notifications").insert({ user_id: m, title: "You were mentioned", message: payload.body.slice(0, 140) });
      }
      return json({ ok: true, note: note.data });
    }
    default:
      return json({ error: "Unknown action" }, 400);
  }
});
