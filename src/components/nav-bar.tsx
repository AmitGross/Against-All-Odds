import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function NavBar() {
  let isAdmin = false;
  let loggedIn = false;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      loggedIn = true;
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      isAdmin = !!profile?.is_admin;
    }
  } catch {
    // ignore — render without admin link
  }

  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/dashboard" className="hover:underline">
        Dashboard
      </Link>
      <Link href="/rooms" className="hover:underline">
        Rooms
      </Link>
      <Link href="/matches" className="hover:underline">
        Matches
      </Link>
      <Link href="/leaderboard" className="hover:underline">
        Leaderboard
      </Link>
      <Link href="/knockouts" className="hover:underline">
        Knockouts
      </Link>
      {isAdmin && (
        <Link
          href="/admin/matches"
          className="rounded bg-clay/10 px-2 py-0.5 text-clay hover:bg-clay/20"
        >
          Admin
        </Link>
      )}
    </nav>
  );
}
