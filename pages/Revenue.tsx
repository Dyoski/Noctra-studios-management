import React, { useState, useMemo } from 'react';
import { useBookingData } from '../context/BookingContext';
import GlassCard from '../components/GlassCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ArrowUpRight, History, Search, CheckCircle2 } from 'lucide-react';

interface RevenueProps {
  onNavigate: (page: string, params?: any) => void;
}

const Revenue: React.FC<RevenueProps> = ({ onNavigate }) => {
  const { payments } = useBookingData();
  const [historySearch, setHistorySearch] = useState('');

  const filteredHistory = useMemo(() => {
    return payments
      .sort((a,b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())
      .filter(p => 
        p.client_name.toLowerCase().includes(historySearch.toLowerCase()) ||
        p.id.includes(historySearch) ||
        new Date(p.received_at).toLocaleDateString('sk-SK').includes(historySearch)
      );
  }, [payments, historySearch]);

  const stats = useMemo(() => {
    const total = payments.reduce((s, p) => s + p.amount, 0);
    return { total };
  }, [payments]);

  const chartData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthPayments = payments.filter(p => {
      const d = new Date(p.received_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const weeks = [
      { name: '1. týždeň', v: 0 },
      { name: '2. týždeň', v: 0 },
      { name: '3. týždeň', v: 0 },
      { name: '4. týždeň', v: 0 }
    ];

    monthPayments.forEach(p => {
      const day = new Date(p.received_at).getDate();
      if (day <= 7) weeks[0].v += p.amount;
      else if (day <= 14) weeks[1].v += p.amount;
      else if (day <= 21) weeks[2].v += p.amount;
      else weeks[3].v += p.amount;
    });

    return weeks;
  }, [payments]);

  return (
    <div className="space-y-8 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Revenue Track</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Finančný Prehľad</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
           <GlassCard className="p-10 flex flex-col items-center text-center border-white/10 group h-full justify-center">
              <div className="p-6 bg-white text-black rounded-3xl mb-8 group-hover:rotate-12 transition-transform">
                <DollarSign size={32} strokeWidth={3} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Celkový príjem</p>
              <h2 className="text-6xl font-black text-white tracking-tighter">€{stats.total}</h2>
           </GlassCard>
        </div>

        <div className="lg:col-span-2">
          <GlassCard className="p-10 border-white/10 h-full">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
               <History size={16} /> MESAČNÝ TREND ({new Date().toLocaleString('sk-SK', { month: 'long' })})
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#444444" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#444444" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(value: number) => [Math.round(value), "Suma (€)"]}
                    contentStyle={{ backgroundColor: '#000000', border: '1px solid #ffffff15', borderRadius: '12px', fontSize: '10px' }}
                    itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="v" stroke="#ffffff" fillOpacity={1} fill="url(#colorV)" name="Príjem" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">HISTÓRIA TRANSAKCIÍ</h2>
           <div className="relative group w-full max-w-sm">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={20} />
              <input value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="w-full bg-white/5 border-2 border-white/5 rounded-3xl py-3 pl-16 pr-6 text-white focus:outline-none focus:border-white/20 transition-all font-black text-xs uppercase tracking-widest placeholder:text-slate-700" placeholder="Hľadať meno alebo dátum..." />
           </div>
        </div>

        <GlassCard className="p-0 border-white/10 overflow-hidden rounded-[3rem]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] border-b border-white/5">
                  <th className="px-10 py-6">DÁTUM</th>
                  <th className="px-10 py-6">KLIENT</th>
                  <th className="px-10 py-6">SUMA</th>
                  <th className="px-10 py-6">STATUS</th>
                  <th className="px-10 py-6 text-right">AKCIA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredHistory.map(p => (
                  <tr key={p.id} onClick={() => onNavigate('clients', { clientId: p.booking_id })} className="group hover:bg-white/5 transition-all cursor-pointer">
                    <td className="px-10 py-8"><p className="text-white font-black text-sm tracking-widest">{new Date(p.received_at).toLocaleDateString('sk-SK')}</p></td>
                    <td className="px-10 py-8"><p className="text-xl font-black text-white tracking-tight group-hover:translate-x-1 transition-transform">{p.client_name}</p></td>
                    <td className="px-10 py-8"><p className="text-2xl font-black text-white tracking-tighter">€{Math.round(p.amount)}</p></td>
                    <td className="px-10 py-8"><div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest"><CheckCircle2 size={14} /> ZÚČTOVANÉ</div></td>
                    <td className="px-10 py-8 text-right"><div className="p-3 bg-white/5 rounded-xl text-slate-500 group-hover:text-white transition-all inline-block"><ArrowUpRight size={20} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </section>
    </div>
  );
};

export default Revenue;