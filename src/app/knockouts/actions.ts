"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function saveKnockoutPrediction(slotId: string, homeScore: number, awayScore: number): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("knockout_predictions").upsert(
    {
      user_id: user.id,
      slot_id: slotId,
      predicted_home_score: homeScore,
      predicted_away_score: awayScore,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,slot_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/knockouts");
  return {};
}
