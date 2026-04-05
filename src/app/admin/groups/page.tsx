import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AdminGroupLocksClient from "./admin-group-locks-client";
import ResetGroupLocksButton from "./reset-group-locks-button";

export default async function AdminGroupsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return <p className="text-red-600">Access denied.</p>;

  const { data: tournament } = await supabase
    .from("tournaments").select("id").eq("is_active", true).single();
  if (!tournament) return <p className="text-red-600">No active tournament found.</p>;

  // Get all group names from matches
  const { data: matchGroups } = await supabase
    .from("matches")
    .select("group_name")
    .eq("tournament_id", tournament.id)
    .eq("stage", "group")
    .not("group_name", "is", null);

  const groupNames = [...new Set((matchGroups ?? []).map((m) => m.group_name as string))].sort();

  // Get current lock states
  const { data: lockRows } = await supabase
    .from("group_locks")
    .select("group_name, is_locked")
    .eq("tournament_id", tournament.id);

  const lockMap: Record<string, boolean> = {};
  for (const l of lockRows ?? []) lockMap[l.group_name] = l.is_locked;

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-2xl font-bold">Admin — Group Prediction Locks</h2>
      <p className="text-sm text-ink/60">
        Lock a group to prevent users from changing their predictions.
      </p>
      <ResetGroupLocksButton />
      <AdminGroupLocksClient
        tournamentId={tournament.id}
        groupNames={groupNames}
        initialLockMap={lockMap}
      />
    </div>
  );
}
