import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { Resend } from "resend";
import { cookies } from "next/headers";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── helpers ────────────────────────────────────────────────────────────────

/** Escape untrusted strings before dropping them into HTML email bodies.
 *  Fixes report section 6.5 — unescaped user input in email HTML. */
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Returns the authenticated coach's user-id, or throws a typed Response
 *  (401 / 403) that the route handler can return directly.
 *  Fixes report section 6.1 — unauthenticated service-role endpoints. */
async function requireCoach(): Promise<string> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        // Route Handlers are read-only in Next.js 15 — we don't need to
        // write auth cookies here, only read them for verification.
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

/** Single, server-only admin client.
 *  Fixes report section 6.8 — duplicated admin-client construction. */
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
    // 1. Authenticate — throws a Response if not a coach.
    //    This MUST happen before the service-role client is used.
    await requireCoach();

    // 2. Validate input.
    const body = await req.json().catch(() => ({}));
    const { applicantId } = body as { applicantId?: string };

    if (!applicantId || typeof applicantId !== "string") {
      return Response.json(
        { success: false, error: "applicantId is required" },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 3. Fetch the applicant (with the admin client so RLS doesn't block it).
    const { data: applicant, error: applicantError } = await supabaseAdmin
      .from("applicants")
      .select("*")
      .eq("id", applicantId)
      .single();

    if (applicantError || !applicant) {
      return Response.json(
        { success: false, error: "Applicant not found" },
        { status: 404 },
      );
    }

    // Guard: don't re-approve an already-approved applicant.
    if (applicant.status === "approved") {
      return Response.json(
        { success: false, error: "Applicant is already approved" },
        { status: 409 },
      );
    }

    // 4. Send an invite link instead of creating a password.
    //    Supabase emails the client a magic link to set their OWN password —
    //    no password ever exists in our code, logs, network responses, or alerts.
    //    Fixes report section 6.2 — generated password in response / alert().
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(applicant.email, {
        data: {
          full_name: applicant.full_name,
          // Supabase stores this in auth.users.raw_user_meta_data.
          // The handle_new_user() trigger (Section 3.7 of the DB migration)
          // reads it when creating the profiles row automatically.
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://neocoaching.vercel.app"}/auth/callback`,
      });

    if (inviteError || !inviteData.user) {
      console.error("Invite error:", inviteError);
      return Response.json(
        { success: false, error: "Failed to create client account" },
        { status: 500 },
      );
    }

    const userId = inviteData.user.id;

    // 5. Create the profile row.
    //    NOTE: if you deploy the handle_new_user() trigger from the DB migration
    //    (Section 5 of database-optimizations.sql), this insert is redundant —
    //    the trigger creates the row automatically. Leave it for now as a
    //    belt-and-suspenders measure; it will fail silently on unique-id
    //    conflict once the trigger is in place (upsert handles that).
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        full_name: applicant.full_name,
        email: applicant.email,
        whatsapp: applicant.whatsapp,
        country: applicant.country,
        age: applicant.age,
        goal: applicant.goal,
        current_weight: applicant.current_weight,
        target_weight: applicant.target_weight,
        role: "client", // hardcoded — never from user input
      },
      { onConflict: "id" },
    );

    if (profileError) {
      // Profile creation failed — attempt to clean up the auth account so
      // we don't leave an orphaned auth.users row with no profile.
      console.error("Profile upsert error:", profileError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return Response.json(
        { success: false, error: "Failed to create client profile" },
        { status: 500 },
      );
    }

    // 6. Mark the applicant as approved.
    await supabaseAdmin
      .from("applicants")
      .update({ status: "approved", approved_client_id: userId })
      .eq("id", applicantId);

    // 7. Notify the coach by email (HTML-escaped, fixes section 6.5).
    //    This is a coach-notification email only — the CLIENT receives their
    //    own invite link email directly from Supabase (step 4 above).
    try {
      await resend.emails.send({
        from: "NeoCoaching <onboarding@resend.dev>",
        to: ["wandileneo4@gmail.com"],
        subject: `✅ Client Approved — ${escapeHtml(applicant.full_name)}`,
        html: `
          <h2>New Client Approved</h2>
          <p>You have successfully approved a new client.</p>
          <hr/>
          <p><strong>Name:</strong> ${escapeHtml(applicant.full_name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(applicant.email)}</p>
          <p><strong>Program:</strong> ${escapeHtml(applicant.program)}</p>
          <p><strong>Country:</strong> ${escapeHtml(applicant.country)}</p>
          <hr/>
          <p>
            The client has been sent a login invite link directly to their email.
            They will set their own password when they first log in.
          </p>
          <p>
            <a href="${escapeHtml(
              process.env.NEXT_PUBLIC_SITE_URL ??
                "https://neocoaching.vercel.app",
            )}/coach/clients">
              View all clients →
            </a>
          </p>
        `,
      });
    } catch (emailError) {
      // A failed coach-notification email should NOT roll back the approval.
      // Log it and continue — the account was successfully created.
      console.error("Coach notification email failed:", emailError);
    }

    // 8. Return success — no password, no sensitive data.
    //    Fixes section 6.2: the coach UI should show a toast, not an alert().
    return Response.json({
      success: true,
      clientId: userId,
      email: applicant.email,
      // message is used by coach/applicants/page.tsx to show the success toast
      message: `Client account created. Login invite sent to ${applicant.email}.`,
    });
  } catch (error) {
    // requireCoach() throws a pre-built Response — return it directly.
    if (error instanceof Response) return error;

    // All other errors: log internally, return a generic message.
    // Fixes section 6.4 — raw error objects in public responses.
    console.error("approve route error:", error);
    return Response.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
