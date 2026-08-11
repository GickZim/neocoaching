import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profile?.role !== "coach") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { audience, category, subject, message } = await req.json();
    if (!subject || !message) {
      return NextResponse.json(
        { error: "Missing subject or message" },
        { status: 400 },
      );
    }

    const recipients = new Map<string, string>(); // email -> name

    if (audience === "leads" || audience === "everyone") {
      let query = supabaseAdmin
        .from("leads")
        .select("email, name")
        .eq("consent", true);
      if (audience === "leads" && category && category !== "all") {
        query = query.eq("category", category);
      }
      const { data: leads } = await query;
      for (const lead of leads ?? []) {
        recipients.set(lead.email, lead.name || "there");
      }
    }

    if (audience === "clients" || audience === "everyone") {
      const { data: clients } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name")
        .eq("role", "client");
      for (const client of clients ?? []) {
        if (client.email)
          recipients.set(client.email, client.full_name || "there");
      }
    }

    if (recipients.size === 0) {
      return NextResponse.json(
        { error: "No matching recipients" },
        { status: 400 },
      );
    }

    const entries = Array.from(recipients.entries());
    const BATCH_SIZE = 90;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const chunk = entries.slice(i, i + BATCH_SIZE);
      const emails = chunk.map(([email, name]) => ({
        from: "Neo Coaching <noreply@neocoaching.online>",
        to: email,
        subject,
        html: `
          <div style="font-family: sans-serif; background:#000; color:#fff; padding:32px;">
            <p>Hey ${name},</p>
            <div style="white-space:pre-wrap; margin:16px 0;">${message}</div>
            <p style="margin-top:24px;color:#999;font-size:12px;">
              — Wandile Neo, Neo Coaching
            </p>
          </div>
        `,
      }));

      try {
        await resend.batch.send(emails);
        sent += chunk.length;
      } catch (err) {
        console.error("Batch send error:", err);
        failed += chunk.length;
      }
    }

    return NextResponse.json({ sent, failed });
  } catch (err) {
    console.error("Broadcast error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
