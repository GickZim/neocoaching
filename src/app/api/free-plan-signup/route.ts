import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const resend = new Resend(process.env.RESEND_API_KEY!);

const VALID_CATEGORIES = ["lose_weight", "gain_weight", "flat_tummy"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  lose_weight: "Lose Weight",
  gain_weight: "Gain Weight",
  flat_tummy: "Flat Tummy",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, category, consent } = body;

    if (!name || !email || !category || !consent) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Insert lead — ignore duplicate email+category, they just get the plan again
    const { error: insertError } = await supabase.from("leads").insert({
      name,
      email,
      category,
      consent,
    });

    if (insertError && insertError.code !== "23505") {
      // 23505 = unique violation, safe to ignore (already signed up before)
      console.error("Lead insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save signup" },
        { status: 500 },
      );
    }

    const downloadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/free-plans/${category.replace("_", "-")}.pdf`;

    // Send email via Resend — don't block the response on this failing
    try {
      await resend.emails.send({
        from: "Neo Coaching <onboarding@resend.dev>",
        to: email,
        subject: `Your Free ${CATEGORY_LABELS[category]} Plan`,
        html: `
          <div style="font-family: sans-serif; background:#000; color:#fff; padding:32px;">
            <h1 style="color:#D4AF37;">Your ${CATEGORY_LABELS[category]} Plan is Ready</h1>
            <p>Hey ${name},</p>
            <p>Thanks for signing up! Here's your free plan:</p>
            <a href="${downloadUrl}" style="display:inline-block;background:#D4AF37;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px;">
              Download Your Plan
            </a>
            <p style="margin-top:24px;color:#999;font-size:12px;">— Wandile Neo, Neo Coaching</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Resend email error:", emailError);
      // Don't fail the whole request — user still gets instant download
    }

    return NextResponse.json({ downloadUrl });
  } catch (err) {
    console.error("Free plan signup error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
