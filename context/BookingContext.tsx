
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../lib/database';
import { Booking, ReceivedPayment, DashboardStats } from '../types';

interface BookingContextType {
  bookings: Booking[];
  payments: ReceivedPayment[];
  stats: DashboardStats | null;
  loading: boolean;
  refreshData: () => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  markAsPaid: (booking: Booking) => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<ReceivedPayment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      const [b, p, s] = await Promise.all([
        db.getBookings(),
        db.getPayments(),
        db.getDashboardStats()
      ]);

      setBookings([...b]);
      setPayments([...p]);
      setStats(s);
    } catch (error) {
      console.error("Chyba pri synchronizácii dát:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const deleteBooking = useCallback(async (id: string) => {
    // 1. Snapshot stavu pre rollback
    let rollbackBookings: Booking[] = [];
    let rollbackStats: DashboardStats | null = null;

    // 2. OKAMŽITÁ AKTUALIZÁCIA (Optimistic UI)
    // Používame funkcionálny update, aby sme mali istotu najnovšieho stavu
    setBookings(prev => {
      rollbackBookings = [...prev];
      return prev.filter(b => b.id !== id);
    });

    setStats(prev => {
      if (!prev) return null;
      rollbackStats = { ...prev };
      return {
        ...prev,
        upcomingSessions: prev.upcomingSessions.filter(s => s.id !== id),
        todaySessions: prev.todaySessions.filter(s => s.id !== id),
        sessionsCountMonth: Math.max(0, prev.sessionsCountMonth - 1)
      };
    });

    try {
      // 3. Volanie databázy
      await db.deleteBooking(id);
      
      // 4. Finálna synchronizácia (tiché overenie na pozadí)
      const freshStats = await db.getDashboardStats();
      setStats(freshStats);
    } catch (error) {
      // 5. ROLLBACK - Ak zlyhá DB, vrátime pôvodné dáta
      setBookings(rollbackBookings);
      setStats(rollbackStats);
      console.error("Zlyhanie mazania, stav bol obnovený:", error);
      throw error;
    }
  }, []);

  const markAsPaid = useCallback(async (booking: Booking) => {
    try {
      await db.createPayment({
        booking_id: booking.id,
        amount: booking.calculated_price,
        received_at: new Date().toISOString(),
        note: `Platba v štúdiu`,
      });

      await refreshData();
    } catch (error) {
      console.error("Chyba pri platbe:", error);
    }
  }, [refreshData]);

  return (
    <BookingContext.Provider value={{
      bookings,
      payments,
      stats,
      loading,
      refreshData,
      deleteBooking,
      markAsPaid
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookingData = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookingData musí byť použitý v rámci BookingProvider');
  }
  return context;
};
