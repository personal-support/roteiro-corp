import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ItineraryStep {
  order: number;
  type: "transfer" | "bus" | "flight" | "car_rental" | "hotel" | "other";
  description: string;
  origin: string;
  destination: string;
  datetime_start: string;   // "DD/MM/YYYY HH:mm" ou estimado
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
  const prompt = `Você é um especialista em logística de viagens corporativas brasileiras.

Analise a solicitação abaixo e monte um roteiro COMPLETO desmembrado em etapas, considerando:
- Distâncias e meios de transporte disponíveis no Brasil
- Se a origem não tem aeroporto, incluir deslocamento até o aeroporto mais próximo
- Hospedagem em CADA local onde o colaborador precisar pernoitar (incluindo paradas no trajeto se necessário)
- Locação de veículo quando necessário no destino ou trajeto
- Sempre considerar que o passageiro precisa chegar com tempo para embarques

Solicitação:
- Origem: ${data.origin}
- Destino: ${data.destination}
- Saída: ${data.departure_datetime}
- Retorno: ${data.return_datetime || "sem retorno definido"}
- Passageiros: ${data.passengers}
- Motivo: ${data.purpose}
- Prioridade: ${data.priority}
- Observações: ${data.notes || "nenhuma"}

Retorne APENAS um JSON válido com esta estrutura exata (sem markdown, sem texto fora do JSON):
{
  "summary": "resumo executivo em 2-3 frases",
  "total_estimated": 0,
  "warnings": ["avisos importantes se houver, ex: aeroporto mais próximo, conexões necessárias"],
  "steps": [
    {
      "order": 1,
      "type": "transfer|bus|flight|car_rental|hotel|other",
      "description": "descrição clara da etapa",
      "origin": "cidade/local de origem",
      "destination": "cidade/local de destino",
      "datetime_start": "data e hora estimada DD/MM/YYYY HH:mm",
      "datetime_end": "data e hora estimada DD/MM/YYYY HH:mm",
      "passengers": ${data.passengers},
      "notes": "observações relevantes para cotação",
      "estimated_value": null
    }
  ]
}

Tipos permitidos:
- transfer: traslado curto (uber, van, taxi)
- bus: ônibus intermunicipal ou interestadual
- flight: passagem aérea
- car_rental: locação de veículo
- hotel: hospedagem (sempre incluir check-in e check-out)
- other: outros serviços

Para hotel, origin e destination devem ser a mesma cidade.
Desmembre ao máximo — cada trecho e cada hospedagem deve ser uma etapa separada.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    const parsed = JSON.parse(text);
    return parsed as GeneratedItinerary;
  } catch {
    return {
      summary: "Erro ao processar roteiro.",
      total_estimated: null,
      steps: [],
      warnings: ["Erro ao gerar roteiro automático. Preencha manualmente."],
    };
  }
}
