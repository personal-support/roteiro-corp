import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { RequestStatus, TripType } from "@/lib/types";
import Link from "next/link";

const statusLabel: Record<RequestStatus, string> = {
  draft: "Rascunho", pending: "Pendente", approved: "Aprovado",
  in_progress: "Em andamento", completed: "Concluído",
  cancelled: "Cancelado", rejected: "Rejeitado",
};
const statusColor: Record<RequestStatus, string> = {
  draft: "bg-gray-100 text-gray-600", pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700", in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700", cancelled: "bg-gray-100 text-gray-500",
  rejected: "bg-red-100 text-red-700",
};
const tripLabel: Record<TripType, string> = {
  transfer: "Traslado", flight: "Aéreo", car_rental: "Locação",
  hotel: "Hotel", combined: "Combinado",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Buscar perfil — usa service role para contornar RLS na primeira query
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <p className="text-gray-500 text-sm">Perfil não encontrado.</p>
        <p className="text-gray-400 text-xs">user_id: {user.id}</p>
        <p className="text-gray-400 text-xs">erro: {profileError?.message}</p>
      </div>
    );
  }

  const { data: requests } = await supabase
    .from("travel_requests")
    .select("id, status, priority, travel_date, destination, trip_type, created_at")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(10);

  const all = requests || [];
  const pending = all.filter((r) => r.status === "pending").length;
  const approved = all.filter((r) => r.status === "approved").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Olá, {profile.full_name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-gray-500">Visão geral das solicitações de viagem</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total de solicitações", value: all.length, color: "text-gray-900" },
          { label: "Pendentes de aprovação", value: pending, color: "text-yellow-600" },
          { label: "Aprovadas", value: approved, color: "text-green-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{kpi.label}</p>
            <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Últimas solicitações</h2>
          <Link href="/requests" className="text-sm text-blue-600 hover:underline">Ver todas</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {all.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              Nenhuma solicitação ainda.{" "}
              <Link href="/requests/new" className="text-blue-600 hover:underline">Criar primeira</Link>
            </div>
          )}
          {all.map((req) => (
            <Link
              key={req.id}
              href={`/requests/${req.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{req.destination}</p>
                <p className="text-xs text-gray-500">{tripLabel[req.trip_type as TripType]} · {req.travel_date}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[req.status as RequestStatus]}`}>
                {statusLabel[req.status as RequestStatus]}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
