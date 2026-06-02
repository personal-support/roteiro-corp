import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/shared/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, company_id, active, created_at, updated_at")
    .eq("id", user.id)
    .single();

  // Se perfil não existe, mostra layout sem sidebar para debug
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full space-y-3">
          <h2 className="font-bold text-gray-900">Perfil não encontrado</h2>
          <p className="text-sm text-gray-500">Usuário autenticado mas sem perfil cadastrado.</p>
          <p className="text-xs text-gray-400 font-mono">user_id: {user.id}</p>
          <p className="text-xs text-gray-400 font-mono">email: {user.email}</p>
        </div>
      </div>
    );
  }

  // Buscar nome da empresa separado para não complicar o tipo
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", profile.company_id)
    .single();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar profile={{ ...profile, company }} />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
