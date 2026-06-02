export type Plan = "trial" | "basic" | "pro";
export type UserRole = "admin" | "buyer" | "requester" | "manager";
export type StepType = "transfer" | "bus" | "flight" | "car_rental" | "hotel" | "other";
export type RequestStatus =
  | "draft" | "pending" | "approved" | "in_progress" | "completed" | "cancelled" | "rejected";
export type Priority = "low" | "normal" | "high" | "urgent";
export type ApprovalAction = "approved" | "rejected" | "requested_changes";

export interface Company {
  id: string; name: string; cnpj: string | null; domain: string | null;
  plan: Plan; active: boolean; created_at: string; updated_at: string;
}

export interface Profile {
  id: string; company_id: string; full_name: string; email: string;
  role: UserRole; active: boolean; created_at: string; updated_at: string;
}

export interface TravelRequest {
  id: string;
  company_id: string;
  requester_id: string;
  buyer_id: string | null;
  origin: string;
  destination: string;
  departure_datetime: string;
  return_datetime: string | null;
  passengers: number;
  purpose: string;
  cost_center: string | null;
  status: RequestStatus;
  priority: Priority;
  ai_summary: string | null;
  ai_warnings: string[] | null;
  total_estimated: number | null;
  final_value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  requester?: Profile;
  buyer?: Profile;
  steps?: ItineraryStep[];
}

export interface ItineraryStep {
  id: string;
  request_id: string;
  order: number;
  type: StepType;
  description: string;
  origin: string;
  destination: string;
  datetime_start: string;
  datetime_end: string;
  passengers: number;
  notes: string;
  supplier_name: string | null;
  supplier_quote: number | null;
  estimated_value: number | null;
  confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Approval {
  id: string; request_id: string; approver_id: string;
  action: ApprovalAction; notes: string | null; created_at: string;
  approver?: Profile;
}
