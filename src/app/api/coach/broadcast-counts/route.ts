import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function requireCoach(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: userData } = await supabaseAdmin.auth.getUser(token);
  if (!userData?.user) return null;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  return profile?.role === "coach" ? userData.user : null;
}

export async function GET(req: NextRequest) {
  const user = await requireCoach(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("category")
    .eq("consent", true);
  const { count: clientCount } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "client");

  const leadCounts: Record<string, number> = { all: leads?.length ?? 0 };
  for (const row of leads ?? []) {
    leadCounts[row.category] = (leadCounts[row.category] || 0) + 1;
  }

  return NextResponse.json({
    leads: leadCounts,
    clients: clientCount ?? 0,
    everyone: (leads?.length ?? 0) + (clientCount ?? 0),
  });
}
