
import React, { useState, useEffect } from 'react';
import { db } from '../lib/database';
import { ReceivedPayment, DashboardStats, Booking } from '../types';
import GlassCard from '../components/GlassCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Wallet, ArrowUpRight, Plus, History } from 'lucide-react';

const Revenue: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [payments, setPayments] = useState<ReceivedPayment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payData, setPayData] = useState({
    booking_id: '',
    amount: 0,
    received_at: new Date().toISOString().split('T')[0],
    note: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const s = await db.getDashboardStats();
    const p = await db.getPayments();
    const b = await db.getBookings();
    setStats(s);
    setPayments(p.sort((a,b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime()));
    setBookings(b);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payData.booking_id || payData.amount <= 0) return;
    await db.createPayment(payData);
    setShowPayModal(false);
    loadData();
  };

  const chartData = [
    { name: 'Týždeň 1', booked: 0, received: 0 },
    { name: 'Týždeň 2', booked: 0, received: 0 },
    { name: 'Týždeň 3', booked: 0, received: 0 },
    { name: 'Týždeň 4', booked: stats?.bookedValueMonth || 0, received: stats?.receivedAmountMonth || 0 },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Financie</h1>
          <p className="text-slate-500">Sledovanie príjmov a reporty</p>
        </div>
        <button 
          onClick={() => setShowPayModal(true)}
          className="bg-white hover:bg-gray-200 text-black font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg"
        >
          <Plus size={18} /> Zaznamenať platbu
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <GlassCard title="Mesačná výkonnosť">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBooked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#666666" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#666666" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#444444" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#444444" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000000', border: '1px solid #ffffff15', borderRadius: '12px', fontSize: '10px' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Area type="monotone" dataKey="booked" stroke="#666666" fillOpacity={1} fill="url(#colorBooked)" name="Rezervované" />
                  <Area type="monotone" dataKey="received" stroke="#ffffff" fillOpacity={1} fill="url(#colorReceived)" name="Prijaté" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 mt-4 justify-center">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-gray-500" /> Rezervované
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-white" /> Prijaté
              </div>
            </div>
          </GlassCard>

          <GlassCard title="Nedávne transakcie">
            <div className="space-y-4">
              {payments.length === 0 ? (
                <p className="text-center py-10 text-slate-700 italic">Žiadna história transakcií.</p>
              ) : (
                payments.map(p => {
                  const booking = bookings.find(b => b.id === p.booking_id);
                  return (
                    <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-white/5 text-white">
                          <ArrowUpRight size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{booking?.client_name || 'Manuálny záznam'}</h4>
                          <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                            {new Date(p.received_at).toLocaleDateString('sk-SK')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-extrabold text-lg">+€{p.amount}</div>
                        <div className="text-[10px] text-slate-700 italic">{p.note}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-8">
          <GlassCard className="bg-white/5 border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase tracking-widest">Čakajúce platby</span>
              <DollarSign size={16} className="text-white" />
            </div>
            <h2 className="text-4xl font-extrabold text-white">
              €{(stats?.bookedValueMonth || 0) - (stats?.receivedAmountMonth || 0)}
            </h2>
            <p className="text-[10px] text-slate-600 mt-2 font-bold uppercase tracking-widest">Zostávajúci zostatok</p>
          </GlassCard>
        </div>
      </div>

      {showPayModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md border-white/20">
            <h3 className="text-2xl font-extrabold text-white mb-6 tracking-tight">Zaznamenať platbu</h3>
            <form onSubmit={handlePayment} className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-widest">Vybrať rezerváciu</span>
                <select 
                  required
                  value={payData.booking_id}
                  onChange={e => setPayData({...payData, booking_id: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                >
                  <option value="">Vyberte klienta...</option>
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>{b.client_name}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-widest">Suma (€)</span>
                  <input 
                    type="number"
                    required
                    value={payData.amount}
                    onChange={e => setPayData({...payData, amount: parseFloat(e.target.value)})}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase block mb-2 tracking-widest">Dátum</span>
                  <input 
                    type="date"
                    required
                    value={payData.received_at}
                    onChange={e => setPayData({...payData, received_at: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                  />
                </label>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-3 text-slate-500 font-bold hover:text-white transition-all uppercase text-xs tracking-widest"
                >
                  Zrušiť
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-white hover:bg-gray-200 text-black font-extrabold py-3 rounded-xl transition-all uppercase text-xs tracking-widest"
                >
                  Uložiť
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Revenue;
