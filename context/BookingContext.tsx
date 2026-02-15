import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../lib/database';
import { Booking, ReceivedPayment, DashboardStats, Task } from '../types';

interface BookingContextType {
  bookings: Booking[];
  payments: ReceivedPayment[];
  tasks: Task[];
  stats: DashboardStats | null;
  loading: boolean;
  refreshData: () => Promise<void>;
  // Bookings
  deleteBooking: (id: string) => Promise<void>;
  markAsPaid: (booking: Booking) => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id' | 'created_at' | 'calculated_price' | 'extra_hours' | 'is_finalized'>) => Promise<void>;
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;
  // Tasks
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'completed'>) => Promise<void>;
  toggleTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  // Timer State
  timerSeconds: number;
  isTimerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<ReceivedPayment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Timer State with persistence
  const [timerSeconds, setTimerSeconds] = useState(() => {
    const saved = localStorage.getItem('noctra_timer_seconds');
    return saved ? parseInt(saved) : 0;
  });
  const [isTimerRunning, setIsTimerRunning] = useState(() => {
    return localStorage.getItem('noctra_timer_running') === 'true';
  });
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = window.setInterval(() => {
        setTimerSeconds(prev => {
          const next = prev + 1;
          localStorage.setItem('noctra_timer_seconds', next.toString());
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    localStorage.setItem('noctra_timer_running', isTimerRunning.toString());
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning]);

  const startTimer = () => setIsTimerRunning(true);
  const stopTimer = () => setIsTimerRunning(false);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    localStorage.setItem('noctra_timer_seconds', '0');
  };

  const refreshData = useCallback(async () => {
    try {
      const [b, p, s, t] = await Promise.all([
        db.getBookings(),
        db.getPayments(),
        db.getDashboardStats(),
        db.getTasks()
      ]);
      setBookings([...b]);
      setPayments([...p]);
      setStats(s);
      setTasks([...t]);
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Bookings Methods
  const addBooking = async (bookingData: any) => {
    await db.createBooking(bookingData);
    await refreshData();
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    await db.updateBooking(id, updates);
    await refreshData();
  };

  const deleteBooking = useCallback(async (id: string) => {
    await db.deleteBooking(id);
    await refreshData();
  }, [refreshData]);

  const markAsPaid = useCallback(async (booking: Booking) => {
    try {
      await db.createPayment({
        booking_id: booking.id,
        client_name: booking.client_name,
        amount: booking.calculated_price,
        extra_hours_count: booking.extra_hours,
        received_at: new Date().toISOString(),
        note: `Platba v štúdiu`,
      });
      await refreshData();
    } catch (error) {
      console.error("Payment error:", error);
    }
  }, [refreshData]);

  // Tasks Methods
  const addTask = async (taskData: any) => {
    await db.createTask(taskData);
    await refreshData();
  };

  const toggleTask = async (task: Task) => {
    await db.updateTask(task.id, { completed: !task.completed });
    await refreshData();
  };

  const deleteTask = async (id: string) => {
    await db.deleteTask(id);
    await refreshData();
  };

  return (
    <BookingContext.Provider value={{
      bookings,
      payments,
      tasks,
      stats,
      loading,
      refreshData,
      deleteBooking,
      markAsPaid,
      addBooking,
      updateBooking,
      addTask,
      toggleTask,
      deleteTask,
      timerSeconds,
      isTimerRunning,
      startTimer,
      stopTimer,
      resetTimer
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookingData = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBookingData error');
  return context;
};