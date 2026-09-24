import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: cors });
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ||
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const authorization = request.headers.get("Authorization");
  if (!url || !anonKey || !authorization)
    return json({ error: "Server configuration missing" }, 500);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user)
    return json({ error: "Authentication required" }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return json({ error: "Invalid JSON body" }, 400);
  const action = String(payload.action || "");
  try {
    if (action === "create-room") {
      const { data, error } = await userClient.rpc("create_multiplayer_room", {
        p_mode: payload.mode,
        p_rounds: payload.rounds,
        p_category: payload.category,
      });
      if (error) throw error;
      return json({ room: data });
    }
    if (action === "join-room") {
      const { data, error } = await userClient.rpc("join_multiplayer_room", {
        p_code: String(payload.code || ""),
      });
      if (error) throw error;
      return json({ room: data });
    }
    if (action === "ready") {
      const { data, error } = await userClient.rpc("set_player_ready", {
        p_room_id: payload.roomId,
        p_ready: Boolean(payload.ready),
      });
      if (error) throw error;
      return json({ player: data });
    }
    if (action === "start-room") {
      const { data, error } = await userClient.rpc("start_multiplayer_room", {
        p_room_id: payload.roomId,
      });
      if (error) throw error;
      return json({ room: data });
    }
    if (action === "get-room") {
      const { data, error } = await userClient.rpc(
        "get_multiplayer_room_state",
        {
          p_room_id: payload.roomId,
        },
      );
      if (error) throw error;
      return json(data);
    }
    if (action === "leave-room") {
      const { data, error } = await userClient.rpc("leave_multiplayer_room", {
        p_room_id: payload.roomId,
      });
      if (error) throw error;
      return json({ left: Boolean(data) });
    }
    if (action === "advance-room") {
      const { data, error } = await userClient.rpc("advance_multiplayer_room", {
        p_room_id: payload.roomId,
      });
      if (error) throw error;
      return json({ room: data });
    }
    if (action === "submit-answer") {
      const { data, error } = await userClient.rpc(
        "submit_multiplayer_answer_localized",
        {
          p_room_id: payload.roomId,
          p_answer: String(payload.answer ?? ""),
          p_locale: String(payload.locale || "en"),
        },
      );
      if (error) throw error;
      return json(data);
    }
    if (action === "purchase-item") {
      const { data, error } = await userClient.rpc("purchase_shop_item", {
        p_scope: payload.scope,
        p_item_id: payload.itemId,
      });
      if (error) throw error;
      return json(data);
    }
    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Action failed" },
      400,
    );
  }
});
