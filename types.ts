
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  reminder_offset_minutes: number | null;
  priority: Priority;
  completed: boolean;
  created_at: string;
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

export interface Booking {
  id: string;
  client_name: string;
  email: string;
  phone: string;
  session_start: string;
  session_end: string;
  package_id: string;
  track_count: number;
  calculated_price: number;
  notes: string;
  created_at: string;
}

export interface ReceivedPayment {
  id: string;
  booking_id: string;
  amount: number;
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
