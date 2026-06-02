import { z } from "zod";

export const TripRequestSchema = z.object({
  origin: z.string().min(2).max(200),
  destination: z.string().min(2).max(200),
  departure_datetime: z.string().min(10),
  return_datetime: z.string().optional().nullable(),
  passengers: z.number().int().min(1).max(50),
  purpose: z.string().min(5).max(500),
  cost_center: z.string().max(100).optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  notes: z.string().max(1000).optional().nullable(),
});

export type TripRequestInput = z.infer<typeof TripRequestSchema>;

export const ItineraryStepSchema = z.object({
  request_id: z.string().uuid(),
  order: z.number().int().min(1),
  type: z.enum(["transfer", "bus", "flight", "car_rental", "hotel", "other"]),
  description: z.string().min(2).max(500),
  origin: z.string().min(2).max(200),
  destination: z.string().min(2).max(200),
  datetime_start: z.string().min(5),
  datetime_end: z.string().min(5),
  passengers: z.number().int().min(1),
  notes: z.string().max(500).default(""),
  supplier_name: z.string().max(200).optional().nullable(),
  supplier_quote: z.number().positive().optional().nullable(),
  estimated_value: z.number().positive().optional().nullable(),
  confirmed: z.boolean().default(false),
});

export type ItineraryStepInput = z.infer<typeof ItineraryStepSchema>;

export const ApprovalSchema = z.object({
  request_id: z.string().uuid(),
  action: z.enum(["approved", "rejected", "requested_changes"]),
  notes: z.string().max(500).optional(),
});
