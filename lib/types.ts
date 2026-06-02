export type Plan = "trial" | "basic" | "pro";
export type UserRole = "admin" | "buyer" | "requester" | "manager";
export type TripType = "transfer" | "flight" | "car_rental" | "hotel" | "combined";
export type RequestStatus =
  | "draft"
  | "pending"
  | "approved"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rejected";
export type Priority = "low" | "normal" | "high" | "urgent";
export type ApprovalAction = "approved" | "rejected" | "requested_changes";

export interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  domain: string | null;
  plan: Plan;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TravelRequest {
  id: string;
  company_id: string;
  requester_id: string;
  buyer_id: string | null;
  trip_type: TripType;
  destination: string;
  origin: string | null;
  travel_date: string;
  return_date: string | null;
  passengers: number;
  purpose: string;
  cost_center: string | null;
  status: RequestStatus;
  priority: Priority;
  estimated_value: number | null;
  final_value: number | null;
  currency: string;
  ai_summary: string | null;
  ai_suggestions: Record<string, unknown> | null;
  notes: string | null;
  attachments: unknown[];
  created_at: string;
  updated_at: string;
  // joins opcionais
  requester?: Profile;
  buyer?: Profile;
}

export interface Approval {
  id: string;
  request_id: string;
  approver_id: string;
  action: ApprovalAction;
  notes: string | null;
  created_at: string;
  approver?: Profile;
}

export interface RequestQuote {
  id: string;
  request_id: string;
  supplier_name: string;
  quote_value: number;
  details: Record<string, unknown> | null;
  selected: boolean;
  created_by: string;
  created_at: string;
}

export interface RequestHistory {
  id: string;
  request_id: string;
  actor_id: string | null;
  event: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
  actor?: Profile;
}
