"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function resetGroupLocks(): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return { error: "Not authorized" };

  const admin = createAdminClient();

  // Unlock all groups
  const { error } = await admin
    .from("group_locks")
    .update({ is_locked: false })
    .neq("group_name", "");

  if (error) return { error: error.message };

  revalidatePath("/admin/groups");
  revalidatePath("/matches");

  return {};
}
