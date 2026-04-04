import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AdminGlobalPredictionsClient from "./admin-global-predictions-client";

export default async function AdminGlobalPredictionsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const [{ data: settings }, { data: teams }, { data: players }] = await Promise.all([
    supabase.from("global_prediction_settings").select("*"),
    supabase.from("teams").select("id, name, flag_url").order("name"),
    supabase.from("players").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Global Predictions Admin</h2>
      <AdminGlobalPredictionsClient
        settings={settings ?? []}
        teams={teams ?? []}
        players={players ?? []}
      />
    </div>
  );
}
