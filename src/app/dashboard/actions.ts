"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updateUsername(newUsername: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = newUsername.trim();

  if (!trimmed) return { error: "Username cannot be empty." };
  if (trimmed.length < 3) return { error: "Username must be at least 3 characters." };
  if (trimmed.length > 30) return { error: "Username must be 30 characters or fewer." };
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed))
    return { error: "Only letters, numbers and underscores allowed." };

  // Check uniqueness case-insensitively (exclude current user)
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", trimmed)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) return { error: "That username is already taken. Please choose another." };

  const { error } = await supabase
    .from("profiles")
    .update({ username: trimmed, username_set: true })
    .eq("id", user.id);

  if (error) return { error: "Failed to update username. Please try again." };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateProfile({
  age,
  country,
}: {
  age: number | null;
  country: string | null;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (age !== null && (age < 8 || age > 120))
    return { error: "Age must be between 8 and 120." };

  const { error } = await supabase
    .from("profiles")
    .update({ age, country })
    .eq("id", user.id);

  if (error) return { error: "Failed to update profile. Please try again." };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function saveGlobalPrediction({
  type,
  teamId,
  playerId,
}: {
  type: string;
  teamId: string | null;
  playerId: string | null;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Don't allow picks on locked predictions
  const { data: setting } = await supabase
    .from("global_prediction_settings")
    .select("is_locked")
    .eq("type", type)
    .single();

  if (setting?.is_locked) return { error: "This prediction is locked." };

  const { error } = await supabase.from("global_predictions").upsert(
    { user_id: user.id, type, team_id: teamId, player_id: playerId, updated_at: new Date().toISOString() },
    { onConflict: "user_id,type" }
  );

  if (error) return { error: "Failed to save prediction." };

  revalidatePath("/dashboard");
  return { success: true };
}
