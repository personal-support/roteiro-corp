import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Endpoint legado — use /api/ai/itinerary
  return NextResponse.json({ error: "Use /api/ai/itinerary" }, { status: 410 });
}
