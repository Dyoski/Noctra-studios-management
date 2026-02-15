
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/database';
import { Client } from '../types';
import GlassCard from '../components/GlassCard';
import { Search, Phone, History, FileText, ChevronRight, Star, ArrowLeft, Trash2, AlertTriangle, X } from 'lucide-react';

interface ClientsProps {
  initialClientId?: string;
}

const Clients: React.FC<ClientsProps> = ({ initialClientId }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (initialClientId && clients.length > 0) {
      const found = clients.find(c => c.history.some(h => h.booking_id === initialClientId));
      if (found) setSelectedClient(found);
    }
  }, [initialClientId, clients]);

  const loadClients = async () => {
    const data = await db.getClients();
    setClients(data);
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    
    await db.deleteClient(selectedClient.id);
    setClients(prev => prev.filter(c => c.id !== selectedClient.id));
    setShowDeleteModal(false);
    setSelectedClient(null);
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search)
    );
  }, [clients, search]);

  return (
    <div className="space-y-10 pb-24">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Studio Database</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Správa Klientov & Vernosť</p>
        </div>
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={20} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border-2 border-white/5 rounded-3xl py-4 pl-16 pr-6 text-white focus:outline-none focus:border-white/20 transition-all font-black text-xs uppercase tracking-widest placeholder:text-slate-700"
            placeholder="Meno alebo telefón..."
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredClients.map(client => (
          <GlassCard 
            key={client.id}
            onClick={() => setSelectedClient(client)}
            className="p-8 border-white/5 hover:border-white/20 transition-all group flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-6">
               <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white font-black text-2xl group-hover:bg-white group-hover:text-black transition-all">
                  {client.name.charAt(0)}
               </div>
               {client.history.length > 3 && (
                 <div className="bg-yellow-500/10 text-yellow-500 p-2 rounded-xl flex items-center gap-1">
                   <Star size={14} fill="currentColor" />
                   <span className="text-[9px] font-black uppercase tracking-widest">VIP</span>
                 </div>
               )}
            </div>
            
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">{client.name}</h3>
            <p className="text-white font-bold tracking-widest uppercase flex items-center gap-2 mb-6 opacity-80 text-xs">
              <Phone size={14} /> {client.phone}
            </p>

            <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Počet nahrávaní</p>
                  <p className="text-white font-black text-lg">{client.history.length}</p>
               </div>
               <ChevronRight size={20} className="text-slate-600 group-hover:text-white group-hover:translate-x-2 transition-all" />
            </div>
          </GlassCard>
        ))}
      </div>

      {selectedClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <GlassCard className="w-full max-w-4xl border-white/20 p-12 relative rounded-[3rem] shadow-[0_0_100px_rgba(255,255,255,0.05)] max-h-[90vh] overflow-y-auto no-scrollbar">
             <button onClick={() => setSelectedClient(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors p-2 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest">
                <ArrowLeft size={16} /> Späť
             </button>
            
             <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-1 space-y-8">
                   <div className="w-32 h-32 bg-white text-black rounded-[2.5rem] flex items-center justify-center text-5xl font-black mx-auto md:mx-0 shadow-2xl">
                      {selectedClient.name.charAt(0)}
                   </div>
                   <div className="space-y-4">
                      <h2 className="text-4xl font-black text-white tracking-tighter">{selectedClient.name}</h2>
                      <div className="space-y-2">
                        <p className="flex items-center gap-3 text-white font-bold text-sm tracking-widest uppercase opacity-90">
                          <Phone size={16} className="text-white" /> {selectedClient.phone}
                        </p>
                      </div>
                   </div>
                   <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                      <div className="flex justify-between">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vernostný status</span>
                         <span className={`text-[9px] font-black uppercase tracking-widest ${selectedClient.is_first_timer ? 'text-emerald-400' : 'text-white'}`}>
                            {selectedClient.is_first_timer ? 'Nový Klient' : 'Verný Klient'}
                         </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Celkový obrat</span>
                        <span className="text-2xl font-black text-white tracking-tighter">€{selectedClient.history.reduce((s, h) => s + h.amount, 0)}</span>
                      </div>
                   </div>

                   {/* Tlačidlo na vymazanie profilu */}
                   <div className="pt-4">
                      <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all group"
                      >
                         <Trash2 size={16} className="group-hover:animate-bounce" />
                         VYMAZAŤ PROFIL
                      </button>
                   </div>
                </div>

                <div className="md:col-span-2 space-y-8">
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
                      <History size={16} /> História nahrávaní
                   </h3>
                   <div className="space-y-3">
                      {selectedClient.history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((h, i) => (
                        <div 
                          key={i} 
                          className={`flex items-center justify-between p-6 border-2 rounded-2xl transition-all group ${h.booking_id === initialClientId ? 'border-emerald-500/50 bg-emerald-500/5' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                        >
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/5 rounded-xl text-white group-hover:scale-110 transition-transform">
                                 <FileText size={18} />
                              </div>
                              <div>
                                 <p className="text-white font-black text-sm tracking-widest uppercase italic">{h.package_name.replace('pkg-', '')}</p>
                                 <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">{new Date(h.date).toLocaleDateString('sk-SK')}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-white font-black text-xl tracking-tighter">€{h.amount}</p>
                              <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${h.status === 'paid' ? 'text-emerald-500' : 'text-yellow-500'}`}>
                                 {h.status === 'paid' ? 'Zaplatené' : 'Čaká na platbu'}
                              </p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </GlassCard>
        </div>
      )}

      {/* Potvrdzovacie modálne okno vymazania */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <GlassCard className="max-w-md w-full p-10 border-white/20 text-center space-y-8 rounded-[2.5rem] shadow-2xl">
              <div className="flex justify-center">
                 <div className="p-5 bg-red-500/10 text-red-500 rounded-full">
                    <AlertTriangle size={48} />
                 </div>
              </div>
              
              <div className="space-y-3">
                 <h3 className="text-2xl font-black text-white uppercase tracking-tight">Potvrdenie vymazania</h3>
                 <p className="text-slate-400 text-sm font-medium leading-relaxed">
                    Naozaj chcete natrvalo vymazať profil klienta <span className="text-white font-black">{selectedClient?.name}</span>? 
                    Táto akcia odstráni všetky jeho údaje a históriu nahrávaní. Tento krok je nevratný.
                 </p>
              </div>

              <div className="flex gap-4">
                 <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
                 >
                    ZRUŠIŤ
                 </button>
                 <button 
                  onClick={handleDeleteClient}
                  className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-500 transition-all shadow-xl shadow-red-600/20"
                 >
                    VYMAZAŤ
                 </button>
              </div>
           </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Clients;
