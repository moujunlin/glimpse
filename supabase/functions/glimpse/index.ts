import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
};

async function getContext(sb: any) {
  try {
    const { data } = await sb.rpc("get_context");
    return data;
  } catch {
    return null;
  }
}

function respond(data: unknown, ctx: unknown, s = 200) {
  const body = ctx != null ? { data, _context: ctx } : data;
  return new Response(JSON.stringify(body), {
    status: s,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function errJson(msg: string, s = 500) {
  return new Response(JSON.stringify({ error: msg }), {
    status: s,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function saveNote(sb: any, body: any) {
  if (body?._note) {
    try { await sb.from("lori_corridor").insert({ note: body._note }); } catch {}
    delete body._note;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 200, headers: cors });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const ctx = await getContext(sb);
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const id = parts.length > 1 ? parts[parts.length - 1] : null;

  try {
    if (req.method === "GET") {
      const { data, error } = await sb
        .from("glimpses")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) return errJson(error.message);
      return respond(data, ctx);
    }

    if (req.method === "POST") {
      const body = await req.json();
      await saveNote(sb, body);
      let photoUrl: string | null = null;

      if (body.photo_base64) {
        const base64 = body.photo_base64.replace(/^data:image\/\w+;base64,/, "");
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const ext = (body.photo_type || "jpeg").replace("image/", "");
        const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: upErr } = await sb.storage
          .from("photos")
          .upload(filename, bytes, {
            contentType: body.photo_type || "image/jpeg",
            upsert: false,
          });
        if (upErr) return errJson("Upload failed: " + upErr.message);

        const { data: urlData } = sb.storage.from("photos").getPublicUrl(filename);
        photoUrl = urlData.publicUrl;
      }

      const { data, error } = await sb
        .from("glimpses")
        .insert({
          text: body.text,
          photo_url: body.photo_url || photoUrl,
          date: body.date || new Date().toISOString().split("T")[0],
        })
        .select()
        .single();
      if (error) return errJson(error.message);
      return respond(data, ctx, 201);
    }

    if (req.method === "PATCH" && id) {
      const body = await req.json();
      await saveNote(sb, body);
      const up: Record<string, unknown> = {};
      if (body.lori_reply !== undefined) up.lori_reply = body.lori_reply;
      if (body.text !== undefined) up.text = body.text;
      if (body.photo_url !== undefined) up.photo_url = body.photo_url;

      const { data, error } = await sb
        .from("glimpses")
        .update(up)
        .eq("id", id)
        .select()
        .single();
      if (error) return errJson(error.message);
      return respond(data, ctx);
    }

    return errJson("Not found", 404);
  } catch (e) {
    return errJson((e as Error).message);
  }
});
