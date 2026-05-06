import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
};

const json = (data: unknown, s = 200) =>
  new Response(JSON.stringify(data), {
    status: s,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 200, headers: cors });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const id = parts.length > 1 ? parts[parts.length - 1] : null;

  try {
    // GET — list all
    if (req.method === "GET") {
      const { data, error } = await sb
        .from("glimpses")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    // POST — create with optional photo upload
    if (req.method === "POST") {
      const body = await req.json();
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
        if (upErr) return json({ error: "Upload failed: " + upErr.message }, 500);

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
      if (error) return json({ error: error.message }, 500);
      return json(data, 201);
    }

    // PATCH — update
    if (req.method === "PATCH" && id) {
      const body = await req.json();
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
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
