import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(100),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password, fullName } = parsed.data;
  const adminSupabase = createAdminClient();

  // Criar usuário sem confirmação de e-mail
  const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // confirma automaticamente — sem e-mail
  });

  if (authError) {
    const msg = authError.message.includes("already registered")
      ? "Este e-mail já está cadastrado."
      : "Erro ao criar conta. Tente novamente.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Determinar company_id pelo domínio do e-mail
  const domain = email.split("@")[1];
  const { data: company } = await adminSupabase
    .from("companies")
    .select("id")
    .eq("domain", domain)
    .single();

  // Se não encontrar empresa pelo domínio, cria empresa genérica para o usuário
  let companyId: string;

  if (company) {
    companyId = company.id;
  } else {
    const { data: newCompany, error: companyError } = await adminSupabase
      .from("companies")
      .insert({
        name: domain,
        domain,
        plan: "trial",
        active: true,
      })
      .select("id")
      .single();

    if (companyError || !newCompany) {
      // Rollback: remover usuário criado
      await adminSupabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: "Erro ao configurar empresa." }, { status: 500 });
    }

    companyId = newCompany.id;
  }

  // Criar perfil — primeiro usuário de empresa nova vira admin
  const { data: existingProfiles } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("company_id", companyId)
    .limit(1);

  const role = !existingProfiles || existingProfiles.length === 0 ? "admin" : "requester";

  const { error: profileError } = await adminSupabase.from("profiles").insert({
    id: authUser.user.id,
    company_id: companyId,
    full_name: fullName,
    email,
    role,
    active: true,
  });

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: "Erro ao criar perfil." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, role });
}
