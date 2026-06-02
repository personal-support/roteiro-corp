import { z } from "zod";

export const TravelRequestSchema = z.object({
  trip_type: z.enum(["transfer", "flight", "car_rental", "hotel", "combined"]),
  destination: z.string().min(2).max(200),
  origin: z.string().max(200).optional(),
  travel_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  passengers: z.number().int().min(1).max(50),
  purpose: z.string().min(5).max(500),
  cost_center: z.string().max(100).optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  estimated_value: z.number().positive().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type TravelRequestInput = z.infer<typeof TravelRequestSchema>;

export const ApprovalSchema = z.object({
  request_id: z.string().uuid(),
  action: z.enum(["approved", "rejected", "requested_changes"]),
  notes: z.string().max(500).optional(),
});

export type ApprovalInput = z.infer<typeof ApprovalSchema>;

export const QuoteSchema = z.object({
  request_id: z.string().uuid(),
  supplier_name: z.string().min(2).max(200),
  quote_value: z.number().positive(),
  details: z.record(z.string(), z.unknown()).optional(),
  selected: z.boolean().default(false),
});

export type QuoteInput = z.infer<typeof QuoteSchema>;
