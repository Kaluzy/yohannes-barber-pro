export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "canceled"
  | "no_show";

export interface Service {
  id: string;
  name: string;
  duration_min: number;
  price: number;
  deposit_amount: number;
  requires_deposit: boolean;
  description: string | null;
  is_active: boolean;
}

export interface Barber {
  id: string;
  full_name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_id: string;
  barber_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
}
