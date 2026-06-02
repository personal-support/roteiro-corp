import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/shared/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, company_id, active, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#ebeff2] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-[#dddddd] p-8 max-w-md w-full space-y-3">
          <h2 className="font-bold text-[#212771]">Perfil não encontrado</h2>
          <p className="text-sm text-[#555555]">Usuário autenticado mas sem perfil cadastrado.</p>
          <p className="text-xs text-gray-400 font-mono">user_id: {user.id}</p>
        </div>
      </div>
    );
  }

  const { data: company } = await supabase
    .from("companies").select("name").eq("id", profile.company_id).single();

  return (
    <div className="flex min-h-screen bg-[#ebeff2]">
      <Sidebar profile={{ ...profile, company }} />
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Header mobile */}
        <div className="md:hidden h-14" />
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          {children}
        </div>
        {/* Rodapé mobile */}
        <footer className="md:hidden text-center py-4 text-xs text-gray-400">
          Desenvolvido por <span className="text-[#f86924] font-semibold">J.Lopes Personal Support</span>
        </footer>
      </main>
    </div>
  );
}
