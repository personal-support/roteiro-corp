import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ItineraryStep {
  order: number;
  type: "transfer" | "bus" | "flight" | "car_rental" | "hotel" | "other";
  description: string;
  origin: string;
  destination: string;
  datetime_start: string;
  datetime_end: string;
  passengers: number;
  notes: string;
  estimated_value: number | null;
}

export interface GeneratedItinerary {
  summary: string;
  total_estimated: number | null;
  steps: ItineraryStep[];
  warnings: string[];
}

export interface TripInput {
  origin: string;
  destination: string;
  departure_datetime: string;
  return_datetime?: string | null;
  passengers: number;
  purpose: string;
  priority: string;
  notes?: string | null;
}

export async function generateItinerary(data: TripInput): Promise<GeneratedItinerary> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY não configurada");
  }

  const prompt = `Você é um especialista em logística de viagens corporativas brasileiras.

Analise a solicitação abaixo e monte um roteiro COMPLETO desmembrado em etapas, considerando:
- Distâncias e meios de transporte disponíveis no Brasil
- Se a origem não tem aeroporto, incluir deslocamento até o aeroporto mais próximo
- Hospedagem em CADA local onde o colaborador precisar pernoitar (incluindo paradas no trajeto)
- Locação de veículo quando necessário no destino ou trajeto
- Sempre considerar tempo para embarques e conexões

Solicitação:
- Origem: ${data.origin}
- Destino: ${data.destination}
- Saída: ${data.departure_datetime}
- Retorno: ${data.return_datetime || "sem retorno definido"}
- Passageiros: ${data.passengers}
- Motivo: ${data.purpose}
- Prioridade: ${data.priority}
- Observações: ${data.notes || "nenhuma"}

Retorne APENAS um JSON válido, sem markdown, sem texto fora do JSON:
{
  "summary": "resumo executivo em 2-3 frases",
  "total_estimated": 0,
  "warnings": ["avisos importantes se houver"],
  "steps": [
    {
      "order": 1,
      "type": "transfer",
      "description": "descrição clara da etapa",
      "origin": "cidade de origem",
      "destination": "cidade de destino",
      "datetime_start": "DD/MM/YYYY HH:mm",
      "datetime_end": "DD/MM/YYYY HH:mm",
      "passengers": ${data.passengers},
      "notes": "observações para cotação",
      "estimated_value": null
    }
  ]
}

Tipos: transfer (traslado curto), bus (ônibus), flight (aéreo), car_rental (locação), hotel (hospedagem), other.
Para hotel: origin e destination são a mesma cidade. Desmembre ao máximo — cada trecho e hospedagem é uma etapa separada.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";

  if (!text) throw new Error("Resposta vazia da API");

  // Remover possível markdown caso o modelo retorne mesmo com instrução
  const clean = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(clean) as GeneratedItinerary;
  } catch {
    console.error("[claude] JSON inválido:", clean.slice(0, 300));
    throw new Error("Resposta da IA não é um JSON válido");
  }
}
