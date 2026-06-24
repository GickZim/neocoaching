import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

/**
 * POST /api/reminders/checkins
 *
 * Finds every client who has NOT submitted a check-in in the last 7 days
 * and sends them a personalised reminder email via Resend.
 *
 * Call this from:
 *  A) Vercel Cron — add to vercel.json (see bottom of this file)
 *  B) Supabase Edge Function — copy the logic into a pg_cron / edge function
 *  C) Manually from the coach dashboard (the "Send reminders" button)
 *
 * Authentication: requires the CRON_SECRET env var so only Vercel / your
 * own callers can trigger it (not the public).
 *
 * Env vars needed (add to .env.local and Vercel dashboard):
 *   CRON_SECRET=<any long random string>
 *   RESEND_API_KEY=<already set>
 *   NEXT_PUBLIC_SUPABASE_URL=<already set>
 *   SUPABASE_SERVICE_ROLE_KEY=<already set>
 *   NEXT_PUBLIC_SITE_URL=https://neocoaching.vercel.app
 */

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function POST(req: Request) {
  // ── Authenticate the cron caller ────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabaseAdmin = getSupabaseAdmin();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://neocoaching.vercel.app";

  try {
    // ── 1. Get all clients ───────────────────────────────────────────────────
    const { data: clients, error: clientError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, goal")
      .eq("role", "client")
      .not("email", "is", null);

    if (clientError) throw clientError;
    if (!clients?.length) {
      return Response.json({ sent: 0, message: "No clients found" });
    }

    // ── 2. Find who last checked in more than 7 days ago (or never) ──────────
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffISO = cutoff.toISOString();

    const { data: recentCheckins } = await supabaseAdmin
      .from("checkins")
      .select("user_id, created_at")
      .gte("created_at", cutoffISO);

    const recentUserIds = new Set((recentCheckins ?? []).map((c) => c.user_id));

    const overdue = clients.filter((c) => !recentUserIds.has(c.id));

    if (!overdue.length) {
      return Response.json({
        sent: 0,
        message: "All clients have checked in recently — no reminders needed",
      });
    }

    // ── 3. Send reminder to each overdue client ───────────────────────────────
    const results = await Promise.allSettled(
      overdue.map(async (client) => {
        const firstName = escapeHtml(
          client.full_name?.split(" ")[0] ?? "there",
        );
        const goalLine = client.goal
          ? `<p>Remember — you're working towards: <strong>${escapeHtml(client.goal)}</strong></p>`
          : "";

        await resend.emails.send({
          from: "Coach Neo <onboarding@resend.dev>",
          to: [client.email],
          subject: `${firstName}, your weekly check-in is waiting 💪`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1"/>
            </head>
            <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#ffffff;">
              <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

                <!-- Logo area -->
                <div style="margin-bottom:32px;">
                  <span style="color:#D4AF37;font-size:22px;font-weight:bold;">NeoCoaching</span>
                </div>

                <!-- Gold top border -->
                <div style="height:3px;background:#D4AF37;border-radius:2px;margin-bottom:32px;"></div>

                <!-- Body -->
                <h1 style="font-size:28px;font-weight:bold;margin:0 0 16px;">
                  Hey ${firstName} 👋
                </h1>

                <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 16px;">
                  It's time for your <strong style="color:#ffffff;">weekly check-in</strong>.
                  Tracking your progress consistently is the single biggest factor in
                  reaching your goal — and Coach Neo reviews every one personally.
                </p>

                ${goalLine}

                <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 32px;">
                  It takes less than 2 minutes. Log your weight, energy, wins,
                  and any challenges you faced this week.
                </p>

                <!-- CTA button -->
                <div style="text-align:center;margin-bottom:32px;">
                  <a
                    href="${siteUrl}/dashboard/checkins"
                    style="display:inline-block;background:#D4AF37;color:#000000;
                           font-weight:bold;font-size:16px;padding:14px 36px;
                           border-radius:12px;text-decoration:none;"
                  >
                    Submit my check-in →
                  </a>
                </div>

                <!-- Divider -->
                <div style="height:1px;background:#27272a;margin-bottom:24px;"></div>

                <p style="color:#52525b;font-size:13px;line-height:1.5;margin:0;">
                  You're receiving this because you're a NeoCoaching client.
                  If you've already checked in this week, ignore this email.
                </p>
                <p style="color:#52525b;font-size:13px;margin:8px 0 0;">
                  — Coach Neo
                </p>
              </div>
            </body>
            </html>
          `,
        });

        return client.email;
      }),
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    if (failed > 0) {
      console.error(
        "Some reminder emails failed:",
        results
          .filter((r) => r.status === "rejected")
          .map((r) => (r as PromiseRejectedResult).reason),
      );
    }

    return Response.json({
      sent,
      failed,
      total: overdue.length,
      message: `Sent ${sent} reminder${sent !== 1 ? "s" : ""}${failed ? `, ${failed} failed` : ""}`,
    });
  } catch (error) {
    console.error("Reminder route error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/**
 * ─── Vercel Cron setup ───────────────────────────────────────────────────────
 *
 * Add this to vercel.json in your project root to run every Monday at 8am UTC:
 *
 * {
 *   "crons": [
 *     {
 *       "path": "/api/reminders/checkins",
 *       "schedule": "0 8 * * 1"
 *     }
 *   ]
 * }
 *
 * Vercel automatically sends the CRON_SECRET as the Authorization header
 * when it calls the route. Set CRON_SECRET in your Vercel environment variables.
 *
 * Schedule reference:
 *   "0 8 * * 1"   = Every Monday at 8am UTC
 *   "0 8 * * 5"   = Every Friday at 8am UTC (end-of-week nudge)
 *   "0 8 * * 1,4" = Monday and Thursday
 */
