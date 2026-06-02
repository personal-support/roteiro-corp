"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ApprovalActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function handleAction(action: "approved" | "rejected" | "requested_changes") {
    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    // Inserir aprovação
    await supabase.from("approvals").insert({
      request_id: requestId,
      approver_id: user!.id,
      action,
      notes: notes || null,
    });

    // Atualizar status da solicitação
    const newStatus =
      action === "approved" ? "approved" :
      action === "rejected" ? "rejected" : "pending";

    await supabase
      .from("travel_requests")
      .update({ status: newStatus, buyer_id: user!.id })
      .eq("id", requestId);

    router.refresh();
    setLoading(false);
    setShowNotes(false);
    setNotes("");
    setPendingAction(null);
  }

  function initiateAction(action: string) {
    setPendingAction(action);
    setShowNotes(true);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-900">Ação de aprovação</p>

      {showNotes ? (
        <div className="space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações (opcional)..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={() => { setShowNotes(false); setPendingAction(null); }}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleAction(pendingAction as "approved" | "rejected" | "requested_changes")}
              disabled={loading}
              className={`flex-1 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-40 ${
                pendingAction === "approved" ? "bg-green-600 hover:bg-green-700" :
                pendingAction === "rejected" ? "bg-red-600 hover:bg-red-700" :
                "bg-yellow-500 hover:bg-yellow-600"
              }`}
            >
              {loading ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => initiateAction("approved")}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
          >
            ✓ Aprovar
          </button>
          <button
            onClick={() => initiateAction("requested_changes")}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 rounded-lg text-sm transition-colors"
          >
            ↩ Solicitar revisão
          </button>
          <button
            onClick={() => initiateAction("rejected")}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
          >
            ✕ Rejeitar
          </button>
        </div>
      )}
    </div>
  );
}
