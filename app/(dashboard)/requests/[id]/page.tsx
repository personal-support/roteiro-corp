import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { RequestStatus, TripType } from "@/lib/types";
import ApprovalActions from "@/components/dashboard/ApprovalActions";

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
  transfer: "Traslado", flight: "Passagem aérea", car_rental: "Locação",
  hotel: "Hospedagem", combined: "Combinado",
};

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role, id")
    .eq("id", user!.id)
    .single();

  const { data: req } = await supabase
    .from("travel_requests")
    .select("*, requester:profiles!requester_id(full_name, email)")
    .eq("id", id)
    .eq("company_id", profile!.company_id)
    .single();

  if (!req) notFound();

  const { data: approvals } = await supabase
    .from("approvals")
    .select("*, approver:profiles!approver_id(full_name)")
    .eq("request_id", id)
    .order("created_at", { ascending: false });

  const canApprove =
    ["admin", "buyer", "manager"].includes(profile!.role) &&
    req.status === "pending";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{req.destination}</h1>
          <p className="text-sm text-gray-500">
            {tripLabel[req.trip_type as TripType]} · {req.travel_date}
            {req.return_date ? ` → ${req.return_date}` : ""}
          </p>
        </div>
        <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${statusColor[req.status as RequestStatus]}`}>
          {statusLabel[req.status as RequestStatus]}
        </span>
      </div>

      {/* Resumo IA */}
      {req.ai_summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">
            ✨ Análise IA
          </p>
          <p className="text-sm text-gray-800">{req.ai_summary}</p>
        </div>
      )}

      {/* Dados */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
        {[
          ["Solicitante", (req.requester as { full_name?: string } | null)?.full_name || "—"],
          ["Passageiros", String(req.passengers)],
          ["Prioridade", req.priority],
          ["Motivo", req.purpose],
          ["Centro de custo", req.cost_center || "—"],
          ["Valor estimado", req.estimated_value ? `R$ ${Number(req.estimated_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"],
          ["Valor final", req.final_value ? `R$ ${Number(req.final_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"],
          ["Observações", req.notes || "—"],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between px-5 py-3">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm text-gray-900 text-right max-w-xs">{value}</span>
          </div>
        ))}
      </div>

      {/* Ações de aprovação */}
      {canApprove && (
        <ApprovalActions requestId={req.id} />
      )}

      {/* Histórico de aprovações */}
      {approvals && approvals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <p className="px-5 py-3 text-sm font-semibold text-gray-900 border-b border-gray-100">
            Histórico de aprovações
          </p>
          <div className="divide-y divide-gray-50">
            {approvals.map((a) => (
              <div key={a.id} className="px-5 py-3">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-gray-900">
                    {(a.approver as { full_name?: string } | null)?.full_name || "—"}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    a.action === "approved" ? "bg-green-100 text-green-700" :
                    a.action === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {a.action === "approved" ? "Aprovado" :
                     a.action === "rejected" ? "Rejeitado" : "Revisão solicitada"}
                  </span>
                </div>
                {a.notes && <p className="text-sm text-gray-500 mt-0.5">{a.notes}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(a.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
