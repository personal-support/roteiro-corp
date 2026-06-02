"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const tripTypes = [
  { value: "transfer", label: "🚗 Traslado" },
  { value: "flight", label: "✈️ Passagem aérea" },
  { value: "car_rental", label: "🚙 Locação de veículo" },
  { value: "hotel", label: "🏨 Hospedagem" },
  { value: "combined", label: "🗺️ Combinado" },
];

const priorities = [
  { value: "low", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

interface AISummary {
  summary: string;
  suggestions: {
    tips?: string[];
    estimated_cost_range?: string;
    lead_time?: string;
  };
}

export default function TravelRequestForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AISummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    trip_type: "flight",
    destination: "",
    origin: "",
    travel_date: "",
    return_date: "",
    passengers: 1,
    purpose: "",
    cost_center: "",
    priority: "normal",
    estimated_value: "",
    notes: "",
  });

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function generateAI() {
    setAiLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        passengers: Number(form.passengers),
        estimated_value: form.estimated_value ? Number(form.estimated_value) : undefined,
        return_date: form.return_date || undefined,
        origin: form.origin || undefined,
        cost_center: form.cost_center || undefined,
        notes: form.notes || undefined,
      };

      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail = data.details?.fieldErrors
          ? Object.entries(data.details.fieldErrors as Record<string, unknown[]>)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          : "";
        throw new Error(data.error + (detail ? ` (${detail})` : ""));
      }

      setAiResult(data);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(asDraft = false) {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user!.id)
      .single();

    const payload = {
      ...form,
      passengers: Number(form.passengers),
      estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
      return_date: form.return_date || null,
      origin: form.origin || null,
      cost_center: form.cost_center || null,
      notes: form.notes || null,
      status: asDraft ? "draft" : "pending",
      company_id: profile!.company_id,
      requester_id: user!.id,
      ai_summary: aiResult?.summary || null,
      ai_suggestions: aiResult?.suggestions || null,
    };

    const { data, error: insertError } = await supabase
      .from("travel_requests")
      .insert(payload)
      .select("id")
      .single();

    if (insertError) {
      setError("Erro ao salvar solicitação.");
      setLoading(false);
      return;
    }

    router.push(`/requests/${data.id}`);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Steps indicator */}
      <div className="flex border-b border-gray-100">
        {["Dados da viagem", "Detalhes", "Revisão com IA"].map((label, i) => (
          <div
            key={label}
            className={`flex-1 py-3 px-4 text-xs font-medium text-center border-b-2 transition-colors ${
              step === i + 1
                ? "border-blue-600 text-blue-600"
                : step > i + 1
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-400"
            }`}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      <div className="p-6 space-y-5">
        {/* STEP 1 */}
        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de viagem
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {tripTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update("trip_type", t.value)}
                    className={`px-3 py-2.5 rounded-lg text-sm border text-left transition-colors ${
                      form.trip_type === t.value
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Destino *">
              <input
                type="text"
                value={form.destination}
                onChange={(e) => update("destination", e.target.value)}
                placeholder="Ex: São Paulo, SP"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>

            <Field label="Origem">
              <input
                type="text"
                value={form.origin}
                onChange={(e) => update("origin", e.target.value)}
                placeholder="Ex: Santos, SP"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Data de ida *">
                <input
                  type="date"
                  value={form.travel_date}
                  onChange={(e) => update("travel_date", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
              <Field label="Data de retorno">
                <input
                  type="date"
                  value={form.return_date}
                  onChange={(e) => update("return_date", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.destination || !form.travel_date}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-40"
            >
              Próximo →
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Passageiros *">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.passengers}
                  onChange={(e) => update("passengers", Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
              <Field label="Prioridade">
                <select
                  value={form.priority}
                  onChange={(e) => update("priority", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Motivo da viagem *">
              <textarea
                value={form.purpose}
                onChange={(e) => update("purpose", e.target.value)}
                rows={3}
                placeholder="Descreva o objetivo da viagem..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Centro de custo">
                <input
                  type="text"
                  value={form.cost_center}
                  onChange={(e) => update("cost_center", e.target.value)}
                  placeholder="Ex: TI-2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
              <Field label="Valor estimado (R$)">
                <input
                  type="number"
                  value={form.estimated_value}
                  onChange={(e) => update("estimated_value", e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            </div>

            <Field label="Observações">
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={2}
                placeholder="Informações adicionais..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </Field>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                ← Voltar
              </button>
              <button
                onClick={generateAI}
                disabled={!form.purpose || aiLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-40"
              >
                {aiLoading ? "Analisando com IA..." : "✨ Analisar com IA →"}
              </button>
            </div>
          </>
        )}

        {/* STEP 3 — Revisão */}
        {step === 3 && aiResult && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">
                ✨ Resumo gerado pela IA
              </p>
              <p className="text-sm text-gray-800">{aiResult.summary}</p>
            </div>

            {aiResult.suggestions && (
              <div className="space-y-3">
                {aiResult.suggestions.estimated_cost_range && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Faixa de custo estimada</span>
                    <span className="text-sm font-medium text-gray-900">
                      {aiResult.suggestions.estimated_cost_range}
                    </span>
                  </div>
                )}
                {aiResult.suggestions.lead_time && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Antecedência recomendada</span>
                    <span className="text-sm font-medium text-gray-900">
                      {aiResult.suggestions.lead_time}
                    </span>
                  </div>
                )}
                {aiResult.suggestions.tips?.length && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Dicas
                    </p>
                    <ul className="space-y-1">
                      {aiResult.suggestions.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                ← Editar
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="px-4 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Salvar rascunho
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-40"
              >
                {loading ? "Enviando..." : "Enviar para aprovação"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
