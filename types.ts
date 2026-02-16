
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to?: string;
  task_time: string | null;
  reminder_active: boolean;
  reminder_offset_minutes: number | null;
  priority: Priority;
  completed: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  is_first_timer: boolean;
  created_at: string;
  history: {
    booking_id: string;
    date: string;
    amount: number;
    package_name: string;
    status: 'paid' | 'pending';
  }[];
}

export interface Booking {
  id: string;
  client_name: string;
  phone: string;
  session_start: string;
  session_end: string;
  package_id: string;
  track_count: number;
  calculated_price: number;
  extra_hours: number;
  early_arrival: string;
  is_first_timer: boolean;
  notes: string;
  is_finalized: boolean;
  created_at: string;
}

export interface ReceivedPayment {
  id: string;
  booking_id: string;
  client_name: string;
  amount: number;
  extra_hours_count: number;
  received_at: string;
  note: string;
  created_at: string;
}

export interface DashboardStats {
  todaySessions: Booking[];
  upcomingSessions: Booking[];
  pendingTasks: Task[];
  bookedValueMonth: number;
  receivedAmountMonth: number;
  sessionsCountMonth: number;
}

export interface Package {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface PricingTier {
  id: string;
  package_id: string;
  track_count: number;
  price: number;
  created_at: string;
}
