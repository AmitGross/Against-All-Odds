import { createServerSupabaseClient } from "@/lib/supabase/server";
import NavLinks from "./nav-links";

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

  return <NavLinks isAdmin={isAdmin} loggedIn={loggedIn} />;
}
