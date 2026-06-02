import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizeTravelRequest } from "@/lib/claude";
import { TravelRequestSchema } from "@/lib/validations/travel-request";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = TravelRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await summarizeTravelRequest(parsed.data);
  return NextResponse.json(result);
}
