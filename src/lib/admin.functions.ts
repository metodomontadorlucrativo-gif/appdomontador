import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FreeAccessEmail = {
  id: string;
  email: string;
  note: string | null;
  created_at: string;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito");
}

export const listFreeAccessEmails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FreeAccessEmail[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("free_access_emails")
      .select("id, email, note, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as FreeAccessEmail[];
  });

export const addFreeAccessEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email("Email inválido").max(255),
        note: z.string().trim().max(200).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }): Promise<FreeAccessEmail> => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("free_access_emails")
      .insert({
        email: data.email,
        note: data.note || null,
        created_by: context.userId,
      })
      .select("id, email, note, created_at")
      .single();
    if (error) {
      if ((error as any).code === "23505")
        throw new Error("Este email já está na lista");
      throw new Error(error.message);
    }

    // If a user with this email already exists, promote them to 'free' / 'active'
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: upErr } = await supabaseAdmin
      .from("profiles")
      .update({
        plan: "free",
        subscription_status: "active",
        subscription_started_at: new Date().toISOString(),
        cancel_requested_at: null,
      })
      .eq("email", data.email);
    if (upErr) {
      // Not fatal — the user might not exist yet
      console.warn("Could not backfill existing profile:", upErr.message);
    }

    return row as FreeAccessEmail;
  });

export const removeFreeAccessEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("free_access_emails")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
