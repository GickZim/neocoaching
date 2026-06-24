import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      program,
      fullName,
      age,
      country,
      email,
      whatsapp,
      currentWeight,
      targetWeight,
      experience,
      gymAccess,
      goal,
      challenge,
      injuries,
      reason,
    } = body;

    await supabaseAdmin.from("applicants").insert({
      program,
      full_name: fullName,
      age,
      country,
      email,
      whatsapp,
      current_weight: currentWeight,
      target_weight: targetWeight,
      experience,
      gym_access: gymAccess,
      goal,
      challenge,
      injuries,
      reason,
    });

    const result = await resend.emails.send({
      from: "NeoCoaching <onboarding@resend.dev>",
      to: ["wandileneo4@gmail.com"],
      subject: `New ${program} Application - ${fullName}`,
      html: `
        <h2>New NeoCoaching Application</h2>

        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Age:</strong> ${age}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>WhatsApp:</strong> ${whatsapp}</p>
        <p><strong>Program:</strong> ${program}</p>
        <hr/>

        <p><strong>Current Weight:</strong> ${currentWeight}</p>
        <p><strong>Target Weight:</strong> ${targetWeight}</p>

        <p><strong>Experience:</strong> ${experience}</p>
        <p><strong>Gym Access:</strong> ${gymAccess}</p>

        <p><strong>Goal:</strong> ${goal}</p>
        <p><strong>Challenge:</strong> ${challenge}</p>
        <p><strong>Injuries:</strong> ${injuries}</p>
        <p><strong>Why Coaching:</strong> ${reason}</p>
      `,
    });

    console.log("RESEND RESULT:", result);

    return Response.json({
      success: true,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error,
      },
      {
        status: 500,
      },
    );
  }
}
