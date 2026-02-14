
import React, { useState } from 'react';
import { useBookingData } from '../context/BookingContext';
import { db } from '../lib/database';
import { Booking } from '../types';
import { PACKAGES, PRICING_TIERS } from '../constants';
import GlassCard from '../components/GlassCard';
import { ChevronLeft, ChevronRight, User, Phone, Clock, AlertCircle, Calendar as CalendarIcon, CheckCircle2, Trash2 } from 'lucide-react';

const Bookings: React.FC = () => {
  const { bookings, payments, deleteBooking, markAsPaid, refreshData } = useBookingData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeInput, setTimeInput] = useState(''); 
  const [formData, setFormData] = useState({
    client_name: '',
    phone: '',
    package_id: PACKAGES[0].id,
    track_count: 1,
    notes: '',
  });

  const isPaid = (bookingId: string) => payments.some(p => p.booking_id === bookingId);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === currentMonth.getMonth() && 
           selectedDate.getFullYear() === currentMonth.getFullYear();
  };

  const hasBooking = (day: number) => {
    return bookings.some(b => {
      const d = new Date(b.session_start);
      return d.getDate() === day && 
             d.getMonth() === currentMonth.getMonth() && 
             d.getFullYear() === currentMonth.getFullYear();
    });
  };

  const isPast = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isToday = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const onDateClick = (day: number) => {
    if (isPast(day)) return;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(date);
    setError(null);
    setTimeInput('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: value });
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) setTimeInput(`${value.slice(0, 2)}:${value.slice(2)}`);
    else setTimeInput(value);
  };

  const handlePackageChange = (pkgId: string) => {
    let tracks = formData.track_count;
    if (pkgId === 'pkg-standart') tracks = 1;
    else if (pkgId === 'pkg-bundle' && tracks < 2) tracks = 2;
    setFormData({ ...formData, package_id: pkgId, track_count: tracks });
  };

  const currentTier = PRICING_TIERS.find(t => 
    t.package_id === formData.package_id && t.track_count === formData.track_count
  );

  const isFormValid = formData.client_name.trim() !== '' && formData.phone.length >= 9 && timeInput.length === 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !isFormValid) return;
    setError(null);

    const [hoursStr, minutesStr] = timeInput.split(':');
    const hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    
    if (hours > 23 || minutes > 59) {
      setError("Neplatný čas (max 23:59)");
      return;
    }

    const start = new Date(selectedDate);
    start.setHours(hours, minutes);

    const end = new Date(start);
    end.setHours(start.getHours() + 2); 

    try {
      await db.createBooking({
        client_name: formData.client_name,
        email: `${formData.client_name.replace(/\s/g, '').toLowerCase()}@noctra.sk`,
        phone: formData.phone,
        session_start: start.toISOString(),
        session_end: end.toISOString(),
        package_id: formData.package_id,
        track_count: formData.track_count,
        notes: formData.notes,
      });
      
      setFormData({ ...formData, client_name: '', phone: '', notes: '' });
      setTimeInput('');
      setSelectedDate(null);
      await refreshData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    // 1. Zobrazenie natívneho potvrdzovacieho dialógu
    const isConfirmed = window.confirm('Naozaj chcete natrvalo odstrániť túto rezerváciu?');
    
    if (!isConfirmed) return;

    try {
      // 2. Voláme deleteBooking z kontextu. 
      // Vďaka optimistickému update v BookingContext zmizne karta OKAMŽITE z UI.
      await deleteBooking(id);
    } catch (err) {
      console.error("Chyba pri mazaní:", err);
      // 3. Ak nastala chyba (napr. problém s databázou), kontext vráti kartu späť a my zobrazíme alert.
      window.alert("Nepodarilo sa odstrániť rezerváciu. Systém obnovil pôvodný stav.");
    }
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const startDay = (firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) + 6) % 7;

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-14 md:h-16" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const today = isToday(d);
      const booked = hasBooking(d);
      const active = isSelected(d);
      const past = isPast(d);

      let styleClasses = "border-transparent text-slate-300";
      let dotColor = "bg-transparent";

      if (past) {
        styleClasses = "opacity-20 pointer-events-none grayscale";
      } else if (today) {
        styleClasses = "bg-white text-black border-black shadow-2xl scale-105 z-10 font-black";
        dotColor = booked ? "bg-red-500" : "bg-emerald-500";
      } else if (active) {
        styleClasses = "bg-white/20 text-white border-white scale-105 z-10 shadow-lg";
        dotColor = booked ? "bg-red-500" : "bg-emerald-500";
      } else if (booked) {
        styleClasses = "border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10";
        dotColor = "bg-red-500";
      } else {
        styleClasses = "border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10";
        dotColor = "bg-emerald-500";
      }

      days.push(
        <button
          key={d}
          disabled={past}
          onClick={() => onDateClick(d)}
          className={`h-14 md:h-16 rounded-2xl flex flex-col items-center justify-center transition-all relative border-[3px] ${styleClasses}`}
        >
          <span className="text-sm font-bold">{d}</span>
          {!past && (
            <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${dotColor}`} />
          )}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-24">
      <header className="text-center space-y-4 pt-12">
        <h1 className="text-7xl font-black tracking-tighter text-white">Rezervácie</h1>
        <p className="text-slate-300 text-xs font-black uppercase tracking-[0.5em]">Noctra management</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 space-y-8">
          <GlassCard className="p-10 md:p-12 overflow-hidden group border-white/10 shadow-2xl rounded-[3rem]">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-4xl font-black text-white capitalize tracking-tighter">
                {currentMonth.toLocaleString('sk-SK', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-4">
                <button onClick={handlePrevMonth} className="p-4 hover:bg-white/10 rounded-2xl transition-all active:scale-90 border border-white/5"><ChevronLeft size={24} className="text-white" /></button>
                <button onClick={handleNextMonth} className="p-4 hover:bg-white/10 rounded-2xl transition-all active:scale-90 border border-white/5"><ChevronRight size={24} className="text-white" /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-4 mb-6">
              {['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'].map(d => (
                <div key={d} className="text-center text-[12px] font-black text-slate-300 uppercase tracking-[0.4em] py-3">{d}</div>
              ))}
              {renderCalendar()}
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-5 sticky top-32">
          {selectedDate ? (
            <GlassCard className="border-white/20 animate-in slide-in-from-right-12 duration-500 shadow-2xl rounded-[3rem] p-6 overflow-hidden max-h-[85vh]">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white text-black rounded-[1.2rem] shadow-2xl shadow-white/20"><CalendarIcon size={24} strokeWidth={3} /></div>
                <div>
                  <h3 className="text-white font-black text-2xl leading-none tracking-tighter">Nová rezervácia</h3>
                  <p className="text-slate-200 text-[10px] mt-1 font-black uppercase tracking-[0.3em]">{selectedDate.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <label className="block group">
                    <span className="text-[10px] font-black text-slate-200 uppercase flex items-center gap-2 mb-1.5 tracking-[0.2em] group-focus-within:text-white transition-colors">
                      <User size={14} className="text-white" /> Meno klienta <span className="text-red-500">*</span>
                    </span>
                    <input 
                      required
                      value={formData.client_name}
                      onChange={e => setFormData({...formData, client_name: e.target.value})}
                      className="w-full bg-white/10 border-2 border-white/5 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-white/40 transition-all text-sm font-bold placeholder:text-slate-500"
                      placeholder="Meno a priezvisko"
                    />
                  </label>
                  
                  <label className="block group">
                    <span className="text-[10px] font-black text-slate-200 uppercase flex items-center gap-2 mb-1.5 tracking-[0.2em] group-focus-within:text-white transition-colors">
                      <Phone size={14} className="text-white" /> Telefón <span className="text-red-500">*</span>
                    </span>
                    <input 
                      required
                      type="text"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className="w-full bg-white/10 border-2 border-white/5 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-white/40 transition-all text-sm font-bold placeholder:text-slate-500"
                      placeholder="09xx xxx xxx"
                    />
                  </label>

                  <label className="block group">
                    <span className="text-[10px] font-black text-slate-200 uppercase flex items-center gap-2 mb-1.5 tracking-[0.2em] group-focus-within:text-white transition-colors">
                      <Clock size={14} className="text-white" /> Čas príchodu
                    </span>
                    <input 
                      type="text"
                      required
                      value={timeInput}
                      onChange={handleTimeInputChange}
                      className="w-full bg-white/10 border-2 border-white/5 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-white/40 transition-all text-lg font-black tracking-[0.2em] placeholder:text-slate-500"
                      placeholder="17:00"
                    />
                  </label>

                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em] block">Výber balíčka</span>
                    <div className="grid grid-cols-2 gap-3">
                      {PACKAGES.map((p, index) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handlePackageChange(p.id)}
                          className={`px-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border-2 ${
                            index === 2 ? 'col-span-2 w-full' : ''
                          } ${
                            formData.package_id === p.id 
                            ? 'bg-white text-black border-white shadow-xl scale-105' 
                            : 'bg-white/5 text-slate-200 border-white/5 hover:border-white/20'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">Suma</span>
                    <span className={`text-2xl font-black tracking-tighter ${formData.track_count > 5 ? 'text-emerald-400' : 'text-white'}`}>
                      {formData.track_count > 5 ? 'DOHODOU' : currentTier ? `€${currentTier.price}` : '---'}
                    </span>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border-2 border-red-500/20 text-red-400 p-3 rounded-2xl text-xs flex items-center gap-3 mb-4 font-black uppercase tracking-tighter">
                      <AlertCircle size={18} className="shrink-0 text-red-400" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={!isFormValid}
                    className={`w-full font-black py-4 rounded-2xl transition-all active:scale-[0.96] uppercase text-[11px] tracking-[0.4em] shadow-2xl ${
                      isFormValid 
                      ? 'bg-white text-black hover:bg-gray-100 shadow-white/10' 
                      : 'bg-white/5 text-slate-400 border-2 border-white/5 cursor-not-allowed'
                    }`}
                  >
                    Vytvoriť záznam
                  </button>
                </div>
              </form>
            </GlassCard>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-20 text-center glass rounded-[3rem] border-2 border-white/5 border-dashed group hover:border-white/10 transition-all duration-1000">
              <div className="p-10 bg-white/5 rounded-[2.5rem] mb-10 group-hover:bg-white/10 transition-all group-hover:scale-110 duration-700">
                <CalendarIcon size={64} className="text-white" strokeWidth={1} />
              </div>
              <p className="text-slate-200 text-sm font-black uppercase tracking-[0.5em] leading-relaxed">
                Aktivujte termín<br/>
                <span className="text-white text-[11px] mt-6 block tracking-[0.2em] font-medium opacity-50">Čakám na vstup</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-24 space-y-16">
        <h3 className="text-5xl font-black text-white flex items-center gap-8 tracking-tighter">
          <Clock size={48} className="text-white" strokeWidth={3} /> Rezervácie
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {bookings
            .filter(b => new Date(b.session_start) >= new Date(new Date().setHours(0,0,0,0)))
            .sort((a,b) => new Date(a.session_start).getTime() - new Date(b.session_start).getTime())
            .map(booking => {
              const pkg = PACKAGES.find(p => p.id === booking.package_id);
              const date = new Date(booking.session_start);
              const paid = isPaid(booking.id);
              
              return (
                <div key={booking.id} className={`bg-black/80 backdrop-blur-3xl p-10 rounded-[4rem] border-2 flex flex-col items-center text-center transition-all duration-300 shadow-2xl ${paid ? 'opacity-40 grayscale-[0.5] scale-[0.97] border-white/5' : 'border-white/5'}`}>
                  <div className="w-full mb-8">
                    <h4 className="font-black text-white text-5xl tracking-tighter mb-4 break-words leading-tight">{booking.client_name}</h4>
                    <div className="flex items-center justify-center gap-4 text-slate-300">
                      <Phone size={24} className="text-white" />
                      <span className="text-xl font-bold tracking-tight">{booking.phone}</span>
                    </div>
                  </div>

                  <div className="w-full h-px bg-white/10 mb-8" />
                  <div className="mb-6">
                    <span className="px-10 py-4 rounded-full text-sm font-black bg-white/5 text-slate-200 uppercase tracking-[0.2em] border border-white/10 inline-block">
                      {pkg?.name}
                    </span>
                  </div>

                  <div className="mb-8">
                    <span className={`text-6xl font-black tracking-tighter ${paid ? 'text-slate-500' : 'text-emerald-400'}`}>
                      {booking.calculated_price > 0 ? `€${booking.calculated_price}` : 'DOHODOU'}
                    </span>
                  </div>

                  <div className="w-full h-px bg-white/10 mb-8" />
                  <div className="mb-12 flex items-center gap-4 text-white uppercase font-black text-[12px] tracking-[0.1em]">
                    <CalendarIcon size={28} className="text-white" />
                    <span>
                      {date.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long' }).toUpperCase()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="w-full flex items-center gap-4">
                    {!paid ? (
                      <button 
                        onClick={() => markAsPaid(booking)}
                        className="flex-[3] bg-white text-black hover:bg-slate-200 transition-all py-8 rounded-[2.5rem] flex items-center justify-center gap-4 font-black uppercase text-[12px] tracking-[0.2em] active:scale-95 shadow-2xl"
                      >
                        <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center">
                          <CheckCircle2 size={18} strokeWidth={3} />
                        </div>
                        <span>Zaplatiť</span>
                      </button>
                    ) : (
                      <div className="flex-[3] bg-emerald-500 text-black py-8 rounded-[2.5rem] flex items-center justify-center gap-4 font-black uppercase text-[12px] tracking-[0.2em] shadow-xl">
                        <CheckCircle2 size={24} strokeWidth={3} />
                        <span>Zaplatené</span>
                      </div>
                    )}
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(booking.id);
                      }}
                      className="flex-1 h-full py-8 aspect-square flex items-center justify-center rounded-[2.5rem] border-2 border-red-600/60 hover:bg-red-600/10 transition-all active:scale-90 group"
                      title="Zrušiť a odstrániť"
                    >
                      <Trash2 size={32} className="text-red-500 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          {bookings.length === 0 && (
            <div className="col-span-full py-52 text-center glass rounded-[5rem] border-2 border-white/5 border-dashed">
              <p className="text-slate-200 font-black uppercase tracking-[0.8em] text-xs opacity-50">Poradovník je prázdny</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookings;
