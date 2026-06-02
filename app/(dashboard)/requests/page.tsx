import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { RequestStatus, TripType } from "@/lib/types";

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

export default async function RequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user!.id)
    .single();

  const query = supabase
    .from("travel_requests")
    .select("id, destination, trip_type, travel_date, status, priority, requester:profiles!requester_id(full_name)")
    .eq("company_id", profile!.company_id)
    .order("created_at", { ascending: false });

  const { data: requests } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Solicitações</h1>
          <p className="text-sm text-gray-500">Todas as viagens da empresa</p>
        </div>
        <Link
          href="/requests/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nova solicitação
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Destino", "Tipo", "Data", "Solicitante", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {!requests?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            )}
            {requests?.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{req.destination}</td>
                <td className="px-4 py-3 text-gray-600">{tripLabel[req.trip_type as TripType]}</td>
                <td className="px-4 py-3 text-gray-600">{req.travel_date}</td>
                <td className="px-4 py-3 text-gray-600">
                  {(req.requester as { full_name?: string } | null)?.full_name || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[req.status as RequestStatus]}`}>
                    {statusLabel[req.status as RequestStatus]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/requests/${req.id}`} className="text-blue-600 hover:underline text-xs">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
