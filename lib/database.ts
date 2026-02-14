
import { Task, Booking, ReceivedPayment, DashboardStats } from '../types';
import { PRICING_TIERS } from '../constants';

const STORAGE_KEYS = {
  TASKS: 'noctra_tasks',
  BOOKINGS: 'noctra_bookings',
  PAYMENTS: 'noctra_payments',
};

// Simulácia sieťovej latencie pre "Supabase" efekt
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

class DatabaseService {
  private getStorage<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- Tasks ---
  async getTasks(): Promise<Task[]> {
    await delay(300);
    return this.getStorage<Task>(STORAGE_KEYS.TASKS).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'completed'>): Promise<Task> {
    await delay(400);
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      completed: false,
      created_at: new Date().toISOString(),
    };
    this.setStorage(STORAGE_KEYS.TASKS, [...tasks, newTask]);
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');
    tasks[index] = { ...tasks[index], ...updates };
    this.setStorage(STORAGE_KEYS.TASKS, tasks);
    return tasks[index];
  }

  async deleteTask(id: string): Promise<void> {
    await delay(500);
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    this.setStorage(STORAGE_KEYS.TASKS, tasks.filter(t => t.id !== id));
  }

  // --- Bookings ---
  async getBookings(): Promise<Booking[]> {
    await delay(200);
    return this.getStorage<Booking>(STORAGE_KEYS.BOOKINGS);
  }

  async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'calculated_price'>): Promise<Booking> {
    await delay(600);
    const bookings = this.getStorage<Booking>(STORAGE_KEYS.BOOKINGS);
    
    const start = new Date(booking.session_start).getTime();
    const end = new Date(booking.session_end).getTime();
    const hasOverlap = bookings.some(b => {
      const bStart = new Date(b.session_start).getTime();
      const bEnd = new Date(b.session_end).getTime();
      return (start < bEnd && end > bStart);
    });
    if (hasOverlap) throw new Error('Tento čas je už obsadený inou rezerváciou.');

    let price = 0;
    if (booking.track_count <= 5) {
      const tier = PRICING_TIERS.find(t => 
        t.package_id === booking.package_id && t.track_count === booking.track_count
      );
      price = tier ? tier.price : 0;
    } else {
      price = 0; // Cena dohodou
    }

    const newBooking: Booking = {
      ...booking,
      id: crypto.randomUUID(),
      calculated_price: price,
      created_at: new Date().toISOString(),
    };
    this.setStorage(STORAGE_KEYS.BOOKINGS, [...bookings, newBooking]);
    return newBooking;
  }

  async deleteBooking(id: string): Promise<void> {
    await delay(700); // Simulácia sieťového volania (Supabase)
    const bookings = this.getStorage<Booking>(STORAGE_KEYS.BOOKINGS);
    this.setStorage(STORAGE_KEYS.BOOKINGS, bookings.filter(b => b.id !== id));
  }

  // --- Payments ---
  async getPayments(): Promise<ReceivedPayment[]> {
    return this.getStorage<ReceivedPayment>(STORAGE_KEYS.PAYMENTS);
  }

  async createPayment(payment: Omit<ReceivedPayment, 'id' | 'created_at'>): Promise<ReceivedPayment> {
    await delay(400);
    const payments = this.getStorage<ReceivedPayment>(STORAGE_KEYS.PAYMENTS);
    const newPayment: ReceivedPayment = {
      ...payment,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    this.setStorage(STORAGE_KEYS.PAYMENTS, [...payments, newPayment]);
    return newPayment;
  }

  // --- Dashboard ---
  async getDashboardStats(): Promise<DashboardStats> {
    await delay(300);
    const now = new Date();
    const todayStr = now.toDateString();
    
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const bookings = this.getStorage<Booking>(STORAGE_KEYS.BOOKINGS);
    const payments = this.getStorage<ReceivedPayment>(STORAGE_KEYS.PAYMENTS);
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);

    const monthBookings = bookings.filter(b => new Date(b.session_start) >= startOfMonth);
    const monthPayments = payments.filter(p => new Date(p.received_at) >= startOfMonth);
    
    const todaySessions = bookings.filter(b => new Date(b.session_start).toDateString() === todayStr);
    
    const upcomingSessions = bookings
      .filter(b => new Date(b.session_start) > endOfToday)
      .sort((a, b) => new Date(a.session_start).getTime() - new Date(b.session_start).getTime());

    const bookedValueMonth = monthBookings.reduce((sum, b) => sum + b.calculated_price, 0) + 
                             monthPayments.reduce((sum, p) => {
                               const b = bookings.find(book => book.id === p.booking_id);
                               return (b && b.calculated_price === 0) ? sum + p.amount : sum;
                             }, 0);

    return {
      todaySessions,
      upcomingSessions,
      pendingTasks: tasks.filter(t => !t.completed),
      bookedValueMonth,
      receivedAmountMonth: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      sessionsCountMonth: monthBookings.length,
    };
  }
}

export const db = new DatabaseService();
