import React, { useState, useMemo } from 'react';
import { useBookingData } from '../context/BookingContext';
import { db } from '../lib/database';
import { Booking } from '../types';
import { PACKAGES, PRICING_TIERS } from '../constants';
import GlassCard from '../components/GlassCard';
import { ChevronLeft, ChevronRight, User, Phone, Clock, AlertCircle, Calendar as CalendarIcon, CheckCircle2, Trash2, X, Music, Search, UserPlus, Save } from 'lucide-react';

const Bookings: React.FC = () => {
  const { bookings, deleteBooking, addBooking, updateBooking, markAsPaid } = useBookingData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [activePaymentBooking, setActivePaymentBooking] = useState<Booking | null>(null);
  const [extraHoursInput, setExtraHoursInput] = useState(0);
  
  const [formData, setFormData] = useState({
    client_name: '',
    phone: '',
    package_id: PACKAGES[0].id,
    track_count: 1,
    is_first_timer: false,
    notes: '',
    timeInput: ''
  });

  const filteredBookings = useMemo(() => {
    return bookings
      .filter(b => 
        b.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.phone.includes(searchQuery)
      )
      .sort((a, b) => {
        if (a.is_finalized !== b.is_finalized) {
          return a.is_finalized ? 1 : -1;
        }
        return new Date(a.session_start).getTime() - new Date(b.session_start).getTime();
      });
  }, [bookings, searchQuery]);

  const calculatePrice = (pkgId: string, tracks: number, isFirst: boolean) => {
    if (tracks > 5) return null;
    const tier = PRICING_TIERS.find(t => t.package_id === pkgId && t.track_count === tracks);
    let base = tier ? tier.price : 0;
    if (isFirst && pkgId === 'pkg-standart') base = 150;
    return base;
  };

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9:]/g, '');
    if (value.length === 2 && !value.includes(':')) value += ':';
    if (value.length > 5) value = value.slice(0, 5);
    setFormData({...formData, timeInput: value});
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !formData.timeInput) return;

    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!regex.test(formData.timeInput)) {
      setError("Neplatný formát času (HH:mm)");
      return;
    }

    const [h, m] = formData.timeInput.split(':').map(Number);
    const start = new Date(selectedDate);
    start.setHours(h, m);
    const end = new Date(start);
    end.setHours(start.getHours() + 2);

    try {
      await addBooking({
        client_name: formData.client_name,
        phone: formData.phone,
        session_start: start.toISOString(),
        session_end: end.toISOString(),
        package_id: formData.package_id,
        track_count: formData.track_count,
        is_first_timer: formData.is_first_timer,
        early_arrival: '',
        notes: formData.notes,
      });
      setFormData({
        client_name: '',
        phone: '',
        package_id: PACKAGES[0].id,
        track_count: 1,
        is_first_timer: false,
        notes: '',
        timeInput: ''
      });
      setSelectedDate(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const onJustSave = async () => {
    if (!activePaymentBooking) return;
    await updateBooking(activePaymentBooking.id, {
      extra_hours: extraHoursInput
    });
    setActivePaymentBooking(null);
    setExtraHoursInput(0);
  };

  const onConfirmPayment = async () => {
    if (!activePaymentBooking) return;
    const basePrice = activePaymentBooking.calculated_price - (activePaymentBooking.extra_hours * 25);
    const finalPrice = basePrice + (extraHoursInput * 25);
    try {
      await db.createPayment({
        booking_id: activePaymentBooking.id,
        client_name: activePaymentBooking.client_name,
        amount: finalPrice,
        extra_hours_count: extraHoursInput,
        received_at: new Date().toISOString(),
        note: `Zaplatené v štúdiu. Nad rámec: ${extraHoursInput}h`,
      });
      await updateBooking(activePaymentBooking.id, {
        extra_hours: extraHoursInput,
        is_finalized: true
      });
      setActivePaymentBooking(null);
      setExtraHoursInput(0);
    } catch (err) {
      console.error("Payment failed", err);
    }
  };

  const confirmDelete = async () => {
    if (bookingToDelete) {
      await deleteBooking(bookingToDelete);
      setBookingToDelete(null);
    }
  };

  const currentPrice = calculatePrice(formData.package_id, formData.track_count, formData.is_first_timer);
  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <div className="space-y-12 pb-24">
      <header className="text-center space-y-6 pt-12">
        <h1 className="text-7xl font-black tracking-tighter text-white">Rezervácie</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <GlassCard className="p-10 border-white/10 shadow-2xl rounded-[3rem]">
             <div className="flex items-center justify-between mb-12">
              <h2 className="text-4xl font-black text-white capitalize tracking-tighter">
                {currentMonth.toLocaleString('sk-SK', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-4">
                <button onClick={handlePrevMonth} className="p-4 hover:bg-white/10 rounded-2xl transition-all"><ChevronLeft size={24} className="text-white" /></button>
                <button onClick={handleNextMonth} className="p-4 hover:bg-white/10 rounded-2xl transition-all"><ChevronRight size={24} className="text-white" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-4">
              {['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'].map(d => (
                <div key={d} className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-3">{d}</div>
              ))}
              {Array.from({ length: (firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) + 6) % 7 }).map((_, i) => <div key={i} />)}
              {Array.from({ length: daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => {
                const day = i + 1;
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const isPast = date < today;
                const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth.getMonth() && selectedDate?.getFullYear() === currentMonth.getFullYear();
                const hasBook = bookings.some(b => {
                  const bd = new Date(b.session_start);
                  return bd.getDate() === day && bd.getMonth() === currentMonth.getMonth() && bd.getFullYear() === currentMonth.getFullYear();
                });
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <button 
                    key={day}
                    disabled={isPast}
                    onClick={() => { setSelectedDate(date); setError(null); }}
                    className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all relative ${
                      isPast ? 'opacity-20 grayscale border-white/5 cursor-not-allowed' :
                      isSelected ? 'bg-white text-black border-white scale-105 z-10 shadow-2xl font-black' : 
                      isToday ? 'border-white bg-white/10 text-white shadow-xl' :
                      hasBook ? 'border-red-500/20 bg-red-500/5 text-red-500' : 'border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <span className="text-sm font-black">{day}</span>
                    {hasBook && !isSelected && !isPast && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />}
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-5">
          {selectedDate ? (
            <GlassCard className="p-10 border-white/20 rounded-[3rem] animate-in slide-in-from-right-8 duration-500">
              <h3 className="text-3xl font-black text-white mb-8 tracking-tighter flex items-center gap-4">
                <div className="p-3 bg-white text-black rounded-2xl"><CalendarIcon size={24} /></div>
                Detail termínu
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="block space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Meno klienta</span>
                    <input required value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-white/30 font-bold" />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Telefón</span>
                    <input required value={formData.phone} onChange={handlePhoneChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-white/30 font-bold" />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <label className="block space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Čas stretnutia (24h)</span>
                    <input type="text" placeholder="HH:mm" required value={formData.timeInput} onChange={handleTimeInput} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-white/30 font-bold" />
                  </label>
                </div>

                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-6">
                   <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Je tento klient nováčik?</span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setFormData({...formData, is_first_timer: true})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.is_first_timer ? 'bg-emerald-500 text-black shadow-lg' : 'bg-white/5 text-slate-400 border border-white/5'}`}>ÁNO</button>
                        <button type="button" onClick={() => setFormData({...formData, is_first_timer: false})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!formData.is_first_timer ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-slate-400 border border-white/5'}`}>NIE</button>
                      </div>
                   </div>
                   {formData.package_id !== 'pkg-standart' && (
                     <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Počet trackov</span>
                          <span className="text-xl font-black text-white">{formData.track_count}</span>
                        </div>
                        <input type="range" min={formData.package_id === 'pkg-bundle' ? "2" : "1"} max="20" step="1" value={formData.track_count} onChange={e => setFormData({...formData, track_count: parseInt(e.target.value)})} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white" />
                     </div>
                   )}
                   <div className="flex gap-2">
                      {PACKAGES.map(p => (
                        <button key={p.id} type="button" onClick={() => { const newTracks = p.id === 'pkg-standart' ? 1 : p.id === 'pkg-bundle' ? Math.max(2, formData.track_count) : formData.track_count; setFormData({...formData, package_id: p.id, track_count: newTracks}); }} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.package_id === p.id ? 'bg-white text-black' : 'bg-white/5 text-slate-400 border border-white/5'}`}>{p.name}</button>
                      ))}
                   </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-white text-black rounded-[2rem]">
                   <span className="font-black uppercase text-xs tracking-widest">Celková suma</span>
                   <span className="text-4xl font-black tracking-tighter">{formData.track_count > 5 ? 'DOHODOU' : `€${currentPrice}`}</span>
                </div>
                <button type="submit" className="w-full bg-white text-black font-black py-5 rounded-[2rem] uppercase text-xs tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Vytvoriť rezerváciu</button>
              </form>
            </GlassCard>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 glass rounded-[3rem] border-2 border-white/5 border-dashed">
              <CalendarIcon size={64} className="text-slate-700 mb-6" />
              <p className="text-slate-500 font-black uppercase tracking-widest text-center text-xs">Vyberte si dátum v kalendári<br/>pre novú rezerváciu</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8 mt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <h3 className="text-5xl font-black text-white tracking-tighter flex items-center gap-6">
              <Clock size={40} className="text-white" /> Poradovník
            </h3>
            <div className="relative group min-w-[300px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={20} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white/5 border-2 border-white/5 rounded-3xl py-3 pl-16 pr-6 text-white focus:outline-none focus:border-white/20 transition-all font-black text-xs uppercase tracking-widest placeholder:text-slate-700" placeholder="Hľadať v poradovníku..." />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredBookings.map(booking => {
            const pkg = PACKAGES.find(p => p.id === booking.package_id);
            const date = new Date(booking.session_start);
            const paid = booking.is_finalized;
            return (
              <div key={booking.id} className={`glass p-10 rounded-[3.5rem] border-2 transition-all relative overflow-hidden group ${paid ? 'opacity-40 grayscale border-white/5' : 'border-white/10 hover:border-white/30'}`}>
                {booking.is_first_timer && <div className="absolute top-6 right-6 bg-emerald-500 text-black p-2 rounded-xl shadow-xl animate-bounce"><UserPlus size={16} strokeWidth={3} /></div>}
                <h4 className="text-4xl font-black text-white tracking-tighter mb-2 truncate">{booking.client_name}</h4>
                <p className="text-white font-bold mb-8 flex items-center gap-2 tracking-widest text-[11px] uppercase opacity-90"><Phone size={14} /> {booking.phone}</p>
                <div className="space-y-4 mb-10">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/60"><span>Balík</span><span className="text-white">{pkg?.name}</span></div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/60"><span>Tracky</span><span className="text-white">{booking.track_count}</span></div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/60"><span>Čas</span><span className="text-white">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span></div>
                </div>
                <div className="flex items-center justify-between mb-10">
                  <span className="text-5xl font-black text-white tracking-tighter">{booking.track_count > 5 ? '???' : `€${booking.calculated_price}`}</span>
                  <div className="text-right"><p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{date.toLocaleDateString('sk-SK')}</p></div>
                </div>
                <div className="flex gap-4">
                  {!paid ? (
                    <button onClick={() => { setActivePaymentBooking(booking); setExtraHoursInput(booking.extra_hours); }} className="flex-1 bg-white text-black font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"><CheckCircle2 size={16} /> ZAZNAMENAŤ PLATBU</button>
                  ) : (
                    <div className="flex-1 bg-emerald-500 text-black font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">DOKONČENÉ</div>
                  )}
                  <button onClick={() => setBookingToDelete(booking.id)} className="p-4 bg-white/5 rounded-2xl text-white hover:text-red-500 border border-white/5 transition-all"><Trash2 size={20} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activePaymentBooking && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
           <GlassCard className="w-full max-w-xl border-white/20 p-12 relative rounded-[3rem]">
             <button onClick={() => setActivePaymentBooking(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white p-2"><X size={24} /></button>
             <h3 className="text-4xl font-black text-white mb-10 tracking-tighter uppercase italic text-center">Zaznamenať platbu</h3>
             <div className="space-y-8">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Klient</p>
                   <p className="text-2xl font-black text-white">{activePaymentBooking.client_name}</p>
                </div>
                <label className="block space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nad rámec (hodiny)</span>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="number" min="0" value={extraHoursInput} onChange={e => setExtraHoursInput(parseInt(e.target.value) || 0)} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:outline-none focus:border-white/20 transition-all font-black text-lg" />
                  </div>
                </label>
                {(() => {
                  const basePrice = activePaymentBooking.calculated_price - (activePaymentBooking.extra_hours * 25);
                  return (
                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cena balíka</span>
                        <span className="text-xl font-black text-white">€{basePrice}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Finálna suma k úhrade</span>
                        <span className="text-4xl font-black text-emerald-400 tracking-tighter">€{basePrice + (extraHoursInput * 25)}</span>
                      </div>
                    </div>
                  );
                })()}
                <div className="flex gap-4">
                  <button onClick={onJustSave} className="flex-1 bg-white/5 border border-white/10 text-white font-black py-6 rounded-[2rem] uppercase text-xs tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2"><Save size={16} /> ZAPÍSAŤ</button>
                  <button onClick={onConfirmPayment} className="flex-1 bg-white text-black font-black py-6 rounded-[2rem] uppercase text-[10px] tracking-[0.1em] shadow-2xl active:scale-95 transition-all text-center">POTVRDIŤ A ZAPLATIŤ</button>
                </div>
             </div>
           </GlassCard>
        </div>
      )}

      {bookingToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <GlassCard className="max-w-md w-full p-10 border-white/20 text-center space-y-8 rounded-[2.5rem]">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto"><AlertCircle size={40} /></div>
            <div className="space-y-2"><h3 className="text-2xl font-black text-white uppercase tracking-tight">Zrušiť rezerváciu?</h3><p className="text-slate-400 font-medium">Naozaj chcete zrušiť túto rezerváciu?</p></div>
            <div className="flex gap-4">
              <button onClick={() => setBookingToDelete(null)} className="flex-1 py-4 rounded-2xl border border-white/10 text-white font-black uppercase text-xs tracking-widest hover:bg-white/5 transition-all">Nie</button>
              <button onClick={confirmDelete} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-xs tracking-widest hover:bg-red-500 transition-all shadow-xl">Áno, zrušiť</button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Bookings;