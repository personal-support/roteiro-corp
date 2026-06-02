import Anthropic from "@anthropic-ai/sdk";
import type { TravelRequestInput } from "./validations/travel-request";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function summarizeTravelRequest(
  data: TravelRequestInput
): Promise<{ summary: string; suggestions: Record<string, unknown> }> {
  const tripTypeMap: Record<string, string> = {
    transfer: "Traslado",
    flight: "Passagem aérea",
    car_rental: "Locação de veículo",
    hotel: "Hospedagem",
    combined: "Viagem combinada",
  };

  const prompt = `Você é um assistente de compras corporativas. Analise esta solicitação de viagem e retorne um JSON com dois campos:
1. "summary": resumo executivo em 2-3 frases em português, destacando destino, datas, tipo e urgência.
2. "suggestions": objeto com sugestões práticas contendo "tips" (array de strings com dicas), "estimated_cost_range" (faixa estimada em BRL como string), "lead_time" (prazo recomendado de antecedência).

Solicitação:
- Tipo: ${tripTypeMap[data.trip_type]}
- Destino: ${data.destination}
- Origem: ${data.origin || "não informada"}
- Data de viagem: ${data.travel_date}
- Retorno: ${data.return_date || "sem retorno definido"}
- Passageiros: ${data.passengers}
- Motivo: ${data.purpose}
- Prioridade: ${data.priority}
- Valor estimado: ${data.estimated_value ? `R$ ${data.estimated_value}` : "não informado"}

Retorne APENAS o JSON, sem markdown, sem texto adicional.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary || "",
      suggestions: parsed.suggestions || {},
    };
  } catch {
    return { summary: text, suggestions: {} };
  }
}
