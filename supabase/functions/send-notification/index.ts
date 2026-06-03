// Supabase Edge Function
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  const { user_id, title, message } = await req.json();
  return new Response(
    JSON.stringify({
      ok: true,
      user_id,
      title,
      message,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
