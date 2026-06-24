import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ─── helpers (mirror of approve/route.ts — extract to src/lib/supabase-server.ts
//              once both routes are updated so requireCoach() lives in one place) ──

async function requireCoach(): Promise<string> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "coach") {
    throw Response.json(
      { success: false, error: "Forbidden — coach access required" },
      { status: 403 },
    );
  }

  return user.id;
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// ─── route handler ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // 1. Must be an authenticated coach.
    //    Fixes report section 6.1 — this endpoint previously had zero auth.
    await requireCoach();

    // 2. Validate input.
    const body = await req.json().catch(() => ({}));
    const { clientId } = body as { clientId?: string };

    if (!clientId || typeof clientId !== "string") {
      return Response.json(
        { success: false, error: "clientId is required" },
        { status: 400 },
      );
    }

    // Basic guard: don't let a coach accidentally delete another coach's account.
    // (A more robust check would verify clientId belongs to a `role: 'client'` profile.)
    const supabaseAdmin = getSupabaseAdmin();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role, full_name, email")
      .eq("id", clientId)
      .single();

    if (!profile) {
      return Response.json(
        { success: false, error: "Client not found" },
        { status: 404 },
      );
    }

    if (profile.role !== "client") {
      return Response.json(
        { success: false, error: "Target account is not a client" },
        { status: 403 },
      );
    }

    // 3. Delete storage objects before the profile/auth rows.
    //    Fixes report section 3.4 — orphaned storage objects after client deletion.
    //    progress-photos are stored under {clientId}/{anything}
    const { data: storageObjects } = await supabaseAdmin.storage
      .from("progress-photos")
      .list(clientId, { limit: 1000 });

    if (storageObjects && storageObjects.length > 0) {
      const paths = storageObjects.map((obj) => `${clientId}/${obj.name}`);
      const { error: storageError } = await supabaseAdmin.storage
        .from("progress-photos")
        .remove(paths);

      if (storageError) {
        // Log but don't abort — a storage cleanup failure shouldn't block
        // account deletion. The orphaned objects can be cleaned up separately.
        console.error(
          `Storage cleanup warning for client ${clientId}:`,
          storageError,
        );
      }
    }

    // 4. Delete profile row.
    //    If the DB cascading FKs from the SQL migration are in place, all
    //    checkins / progress_photos / daily_tracking / client_workouts /
    //    client_meal_plans rows are deleted automatically via ON DELETE CASCADE.
    //    If the FKs are not yet in place, those rows become orphaned — run
    //    Section 3 of database-optimizations.sql first.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", clientId);

    if (profileError) {
      console.error("Profile delete error:", profileError);
      return Response.json(
        { success: false, error: "Failed to delete client profile" },
        { status: 500 },
      );
    }

    // 5. Delete auth account last (after the profile, so auth.uid() lookups
    //    in any concurrent requests fail cleanly rather than finding a user
    //    with no profile row).
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(clientId);

    if (authError) {
      // The profile is already deleted — log and return partial success so the
      // coach knows to manually remove the orphaned auth entry in Supabase dashboard.
      console.error("Auth delete error (profile already deleted):", authError);
      return Response.json(
        {
          success: false,
          error:
            "Profile deleted but auth account removal failed. Please contact support.",
        },
        { status: 500 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;

    console.error("delete route error:", error);
    return Response.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
