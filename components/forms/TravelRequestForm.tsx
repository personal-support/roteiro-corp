"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ItineraryStep, StepType } from "@/lib/types";

const priorities = [
  { value: "low", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

const stepTypeLabel: Record<StepType, string> = {
  transfer: "🚗 Traslado",
  bus: "🚌 Ônibus",
  flight: "✈️ Aéreo",
  car_rental: "🚙 Locação de veículo",
  hotel: "🏨 Hospedagem",
  other: "📦 Outro",
};

const stepTypeColor: Record<StepType, string> = {
  transfer: "bg-purple-50 border-purple-200",
  bus: "bg-orange-50 border-orange-200",
  flight: "bg-blue-50 border-blue-200",
  car_rental: "bg-teal-50 border-teal-200",
  hotel: "bg-yellow-50 border-yellow-200",
  other: "bg-gray-50 border-gray-200",
};

interface StepData {
  order: number;
  type: StepType;
  description: string;
  origin: string;
  destination: string;
  datetime_start: string;
  datetime_end: string;
  passengers: number;
  notes: string;
  estimated_value: number | null;
}

export default function TravelRequestForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const [steps, setSteps] = useState<StepData[]>([]);
  const [totalEstimated, setTotalEstimated] = useState<number | null>(null);

  const [form, setForm] = useState({
    origin: "",
    destination: "",
    departure_datetime: "",
    return_datetime: "",
    passengers: 1,
    purpose: "",
    cost_center: "",
    priority: "normal",
    notes: "",
  });

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateStep(index: number, field: string, value: string | number | null) {
    setSteps((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  function addStep() {
    setSteps((prev) => [...prev, {
      order: prev.length + 1,
      type: "transfer",
      description: "",
      origin: "",
      destination: "",
      datetime_start: "",
      datetime_end: "",
      passengers: form.passengers,
      notes: "",
      estimated_value: null,
    }]);
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  }

  function calcTotal() {
    return steps.reduce((sum, s) => sum + (s.estimated_value || 0), 0);
  }

  async function generateAI() {
    if (!form.origin || !form.destination || !form.departure_datetime || !form.purpose) {
      setError("Preencha origem, destino, data de saída e motivo.");
      return;
    }
    setAiLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          passengers: Number(form.passengers),
          return_datetime: form.return_datetime || null,
          notes: form.notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar roteiro");

      setAiSummary(data.summary);
      setAiWarnings(data.warnings || []);
      setTotalEstimated(data.total_estimated);
      setSteps(data.steps.map((s: StepData & { type: string }) => ({
        ...s,
        type: s.type as StepType,
        estimated_value: s.estimated_value ?? null,
      })));
      setStep(2);
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
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user!.id).single();

    const { data: req, error: reqError } = await supabase
      .from("travel_requests")
      .insert({
        company_id: profile!.company_id,
        requester_id: user!.id,
        origin: form.origin,
        destination: form.destination,
        departure_datetime: form.departure_datetime,
        return_datetime: form.return_datetime || null,
        passengers: Number(form.passengers),
        purpose: form.purpose,
        cost_center: form.cost_center || null,
        priority: form.priority,
        notes: form.notes || null,
        status: asDraft ? "draft" : "pending",
        ai_summary: aiSummary || null,
        ai_warnings: aiWarnings.length ? aiWarnings : null,
        total_estimated: calcTotal() || null,
      })
      .select("id")
      .single();

    if (reqError || !req) {
      setError("Erro ao salvar solicitação.");
      setLoading(false);
      return;
    }

    if (steps.length > 0) {
      await supabase.from("itinerary_steps").insert(
        steps.map((s) => ({ ...s, request_id: req.id }))
      );
    }

    router.push(`/requests/${req.id}`);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Step indicator */}
      <div className="flex border-b border-gray-200">
        {["Dados da viagem", "Roteiro gerado pela IA"].map((label, i) => (
          <div key={label} className={`flex-1 py-3 text-center text-xs font-medium border-b-2 transition-colors ${
            step === i + 1 ? "border-blue-600 text-blue-600" :
            step > i + 1 ? "border-green-500 text-green-600" :
            "border-transparent text-gray-400"
          }`}>
            {i + 1}. {label}
          </div>
        ))}
      </div>

      {/* STEP 1 — Dados da viagem */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Origem *">
              <input type="text" value={form.origin} onChange={(e) => update("origin", e.target.value)}
                placeholder="Ex: Patrocínio/MG" className={input} />
            </Field>
            <Field label="Destino *">
              <input type="text" value={form.destination} onChange={(e) => update("destination", e.target.value)}
                placeholder="Ex: Aracruz/ES" className={input} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Data e hora de saída *">
              <input type="datetime-local" value={form.departure_datetime}
                onChange={(e) => update("departure_datetime", e.target.value)} className={input} />
            </Field>
            <Field label="Data e hora de retorno">
              <input type="datetime-local" value={form.return_datetime}
                onChange={(e) => update("return_datetime", e.target.value)} className={input} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Passageiros *">
              <input type="number" min={1} max={50} value={form.passengers}
                onChange={(e) => update("passengers", Number(e.target.value))} className={input} />
            </Field>
            <Field label="Prioridade">
              <select value={form.priority} onChange={(e) => update("priority", e.target.value)} className={input}>
                {priorities.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Centro de custo">
              <input type="text" value={form.cost_center} onChange={(e) => update("cost_center", e.target.value)}
                placeholder="Ex: TI-2024" className={input} />
            </Field>
          </div>

          <Field label="Motivo da viagem *">
            <textarea value={form.purpose} onChange={(e) => update("purpose", e.target.value)}
              rows={3} placeholder="Descreva o objetivo da viagem..."
              className={`${input} resize-none`} />
          </Field>

          <Field label="Observações adicionais">
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)}
              rows={2} placeholder="Ex: colaborador tem preferência de companhia aérea, precisa de carro com capacidade para equipamentos..."
              className={`${input} resize-none`} />
          </Field>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button onClick={generateAI} disabled={aiLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            {aiLoading ? "Gerando roteiro com IA..." : "✨ Gerar roteiro com IA →"}
          </button>
        </div>
      )}

      {/* STEP 2 — Roteiro gerado */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Resumo IA */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">✨ Análise da IA</p>
            <p className="text-sm text-gray-800">{aiSummary}</p>
          </div>

          {/* Avisos */}
          {aiWarnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">⚠️ Atenção</p>
              {aiWarnings.map((w, i) => (
                <p key={i} className="text-sm text-yellow-800">• {w}</p>
              ))}
            </div>
          )}

          {/* Etapas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">
                Roteiro — {steps.length} etapa{steps.length !== 1 ? "s" : ""}
              </h3>
              <button onClick={addStep}
                className="text-xs text-blue-600 hover:underline font-medium">
                + Adicionar etapa
              </button>
            </div>

            {steps.map((s, i) => (
              <div key={i} className={`rounded-xl border p-4 space-y-3 ${stepTypeColor[s.type]}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 bg-white rounded-full w-6 h-6 flex items-center justify-center border border-gray-200">
                      {s.order}
                    </span>
                    <select value={s.type} onChange={(e) => updateStep(i, "type", e.target.value)}
                      className="text-sm font-medium bg-transparent border-0 focus:outline-none cursor-pointer">
                      {Object.entries(stepTypeLabel).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={() => removeStep(i)} className="text-xs text-red-400 hover:text-red-600">
                    Remover
                  </button>
                </div>

                <input type="text" value={s.description}
                  onChange={(e) => updateStep(i, "description", e.target.value)}
                  placeholder="Descrição da etapa"
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />

                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={s.origin}
                    onChange={(e) => updateStep(i, "origin", e.target.value)}
                    placeholder="Origem"
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <input type="text" value={s.destination}
                    onChange={(e) => updateStep(i, "destination", e.target.value)}
                    placeholder="Destino"
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Início</p>
                    <input type="text" value={s.datetime_start}
                      onChange={(e) => updateStep(i, "datetime_start", e.target.value)}
                      placeholder="DD/MM/YYYY HH:mm"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Fim</p>
                    <input type="text" value={s.datetime_end}
                      onChange={(e) => updateStep(i, "datetime_end", e.target.value)}
                      placeholder="DD/MM/YYYY HH:mm"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Valor estimado (R$)</p>
                    <input type="number" value={s.estimated_value ?? ""}
                      onChange={(e) => updateStep(i, "estimated_value", e.target.value ? Number(e.target.value) : null)}
                      placeholder="0,00"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Passageiros</p>
                    <input type="number" min={1} value={s.passengers}
                      onChange={(e) => updateStep(i, "passengers", Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>

                <textarea value={s.notes} onChange={(e) => updateStep(i, "notes", e.target.value)}
                  placeholder="Observações para cotação..."
                  rows={2}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
              </div>
            ))}
          </div>

          {/* Total */}
          {calcTotal() > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total estimado</span>
              <span className="text-lg font-bold text-gray-900">
                R$ {calcTotal().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg text-sm hover:bg-gray-50">
              ← Editar dados
            </button>
            <button onClick={() => handleSubmit(true)} disabled={loading}
              className="px-5 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40">
              Rascunho
            </button>
            <button onClick={() => handleSubmit(false)} disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-40">
              {loading ? "Enviando..." : "Enviar para aprovação"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const input = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
