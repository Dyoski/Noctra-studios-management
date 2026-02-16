
import { Task, Booking, ReceivedPayment, DashboardStats, Client, User } from '../types';
import { PRICING_TIERS } from '../constants';

const STORAGE_KEYS = {
  TASKS: 'noctra_tasks',
  BOOKINGS: 'noctra_bookings',
  PAYMENTS: 'noctra_payments',
  CLIENTS: 'noctra_clients',
  USERS: 'noctra_users'
};

class DatabaseService {
  private getStorage<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Auth Methods
  async getUsers(): Promise<User[]> {
    return this.getStorage<User>(STORAGE_KEYS.USERS);
  }

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'password_hash'>, passwordRaw: string): Promise<User> {
    const users = await this.getUsers();
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      password_hash: btoa(passwordRaw), // Jednoduché šifrovanie
      created_at: new Date().toISOString()
    };
    this.setStorage(STORAGE_KEYS.USERS, [...users, newUser]);
    return newUser;
  }

  // ... (zvyšok pôvodného kódu DatabaseService zostáva nezmenený)
  async cleanUpOldPaidBookings(): Promise<void> {
    const bookings = this.getStorage<Booking>(STORAGE_KEYS.BOOKINGS);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filtered = bookings.filter(b => {
      if (!b.is_finalized) return true;
      const bDate = new Date(b.session_start);
      return bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear;
    });

    if (filtered.length !== bookings.length) {
      this.setStorage(STORAGE_KEYS.BOOKINGS, filtered);
    }
  }

  async getClients(): Promise<Client[]> {
    return this.getStorage<Client>(STORAGE_KEYS.CLIENTS).sort((a, b) => a.name.localeCompare(b.name));
  }

  async deleteClient(id: string): Promise<void> {
    const clients = this.getStorage<Client>(STORAGE_KEYS.CLIENTS);
    this.setStorage(STORAGE_KEYS.CLIENTS, clients.filter(c => c.id !== id));
  }

  async upsertClientFromBooking(booking: Booking, payment?: ReceivedPayment): Promise<void> {
    const clients = this.getStorage<Client>(STORAGE_KEYS.CLIENTS);
    let client = clients.find(c => c.phone === booking.phone);

    const historyEntry = {
      booking_id: booking.id,
      date: booking.session_start,
      amount: booking.calculated_price,
      package_name: booking.package_id,
      status: (payment || booking.is_finalized ? 'paid' : 'pending') as 'paid' | 'pending'
    };

    if (!client) {
      client = {
        id: crypto.randomUUID(),
        name: booking.client_name,
        phone: booking.phone,
        is_first_timer: booking.is_first_timer,
        created_at: new Date().toISOString(),
        history: [historyEntry]
      };
      clients.push(client);
    } else {
      const existingIdx = client.history.findIndex(h => h.booking_id === booking.id);
      if (existingIdx > -1) {
        client.history[existingIdx] = historyEntry;
      } else {
        client.history.push(historyEntry);
      }
      if (client.history.length > 1) client.is_first_timer = false;
    }

    this.setStorage(STORAGE_KEYS.CLIENTS, clients);
  }

  async getTasks(): Promise<Task[]> {
    return this.getStorage<Task>(STORAGE_KEYS.TASKS);
  }

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'completed'>): Promise<Task> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    const newTask: Task = { ...task, id: crypto.randomUUID(), completed: false, created_at: new Date().toISOString() };
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
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    this.setStorage(STORAGE_KEYS.TASKS, tasks.filter(t => t.id !== id));
  }

  async deleteAllTasks(): Promise<void> {
    this.setStorage(STORAGE_KEYS.TASKS, []);
  }

  async getBookings(): Promise<Booking[]> {
    await this.cleanUpOldPaidBookings();
    return this.getStorage<Booking>(STORAGE_KEYS.BOOKINGS);
  }

  async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'calculated_price' | 'extra_hours' | 'is_finalized'>): Promise<Booking> {
    const bookings = this.getStorage<Booking>(STORAGE_KEYS.BOOKINGS);
    let price = 0;
    if (booking.track_count <= 5) {
      const tier = PRICING_TIERS.find(t => t.package_id === booking.package_id && t.track_count === booking.track_count);
      price = tier ? tier.price : 0;
      if (booking.is_first_timer && booking.package_id === 'pkg-standart') price = 150;
    }

    const newBooking: Booking = {
      ...booking,
      id: crypto.randomUUID(),
      calculated_price: price,
      extra_hours: 0,
      is_finalized: false,
      created_at: new Date().toISOString(),
    };
    
    this.setStorage(STORAGE_KEYS.BOOKINGS, [...bookings, newBooking]);
    await this.upsertClientFromBooking(newBooking);
    return newBooking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const bookings = this.getStorage<Booking>(STORAGE_KEYS.BOOKINGS);
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Booking not found');
    
    const updated = { ...bookings[index], ...updates };
    
    if (updates.track_count !== undefined || updates.package_id !== undefined || updates.extra_hours !== undefined || updates.is_first_timer !== undefined) {
      if (updated.track_count <= 5) {
        const tier = PRICING_TIERS.find(t => t.package_id === updated.package_id && t.track_count === updated.track_count);
        let base = tier ? tier.price : 0;
        if (updated.is_first_timer && updated.package_id === 'pkg-standart') base = 150;
        updated.calculated_price = base + (updated.extra_hours * 25);
      }
    }

    bookings[index] = updated;
    this.setStorage(STORAGE_KEYS.BOOKINGS, bookings);
    await this.upsertClientFromBooking(updated);
    return updated;
  }

  async deleteBooking(id: string): Promise<void> {
    const bookings = this.getStorage<Booking>(STORAGE_KEYS.BOOKINGS);
    this.setStorage(STORAGE_KEYS.BOOKINGS, bookings.filter(b => b.id !== id));
  }

  async getPayments(): Promise<ReceivedPayment[]> {
    return this.getStorage<ReceivedPayment>(STORAGE_KEYS.PAYMENTS);
  }

  async createPayment(payment: Omit<ReceivedPayment, 'id' | 'created_at'>): Promise<ReceivedPayment> {
    const payments = this.getStorage<ReceivedPayment>(STORAGE_KEYS.PAYMENTS);
    const newPayment: ReceivedPayment = { ...payment, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    this.setStorage(STORAGE_KEYS.PAYMENTS, [...payments, newPayment]);
    
    const bookings = this.getStorage<Booking>(STORAGE_KEYS.BOOKINGS);
    const bIdx = bookings.findIndex(b => b.id === payment.booking_id);
    if (bIdx > -1) {
      bookings[bIdx].is_finalized = true;
      this.setStorage(STORAGE_KEYS.BOOKINGS, bookings);
      await this.upsertClientFromBooking(bookings[bIdx], newPayment);
    }

    return newPayment;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const bookings = this.getStorage<Booking>(STORAGE_KEYS.BOOKINGS);
    const payments = this.getStorage<ReceivedPayment>(STORAGE_KEYS.PAYMENTS);
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      todaySessions: bookings.filter(b => 
        new Date(b.session_start).toDateString() === now.toDateString() && !b.is_finalized
      ),
      upcomingSessions: bookings.filter(b => new Date(b.session_start) > now && !b.is_finalized).sort((a,b) => new Date(a.session_start).getTime() - new Date(b.session_start).getTime()),
      pendingTasks: tasks.filter(t => !t.completed),
      bookedValueMonth: bookings.filter(b => new Date(b.session_start) >= startOfMonth).reduce((sum, b) => sum + b.calculated_price, 0),
      receivedAmountMonth: payments.filter(p => new Date(p.received_at) >= startOfMonth).reduce((sum, p) => sum + p.amount, 0),
      sessionsCountMonth: bookings.filter(b => new Date(b.session_start) >= startOfMonth).length,
    };
  }
}

export const db = new DatabaseService();
