import React from 'react';
import { useBookingData } from '../context/BookingContext';
import GlassCard from '../components/GlassCard';
import { TrendingUp, CreditCard, Music, ListTodo, Calendar, Phone, User } from 'lucide-react';
import { PACKAGES } from '../constants';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { stats, loading } = useBookingData();

  if (loading) return <div className="animate-pulse text-slate-300 text-center mt-20 uppercase tracking-widest text-xs font-black">Kalibrujem štúdio...</div>;

  return (
    <div className="space-y-10">
      {/* Metrics Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Hodnota rezervácií" 
          value={`€${stats?.bookedValueMonth}`} 
          icon={TrendingUp} 
          color="text-white" 
          sub="Tento mesiac"
        />
        <MetricCard 
          label="Prijaté platby" 
          value={`€${stats?.receivedAmountMonth}`} 
          icon={CreditCard} 
          color="text-white" 
          sub="Tento mesiac"
        />
        <MetricCard 
          label="Stretnutia" 
          value={stats?.sessionsCountMonth.toString() || "0"} 
          icon={Music} 
          color="text-white" 
          sub="Tento mesiac"
        />
        <MetricCard 
          label="Úlohy" 
          value={stats?.pendingTasks.length.toString() || "0"} 
          icon={ListTodo} 
          color="text-white" 
          sub="Čakajúce"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content: Upcoming Sessions */}
        <div className="lg:col-span-8">
          <GlassCard className="h-full text-center p-8">
            <h3 className="text-xl font-black text-white mb-8 tracking-tight uppercase">Nadchádzajúce stretnutia</h3>
            {stats?.upcomingSessions.length === 0 ? (
              <p className="text-slate-400 italic py-24 text-center font-bold text-sm">Žiadne nadchádzajúce stretnutia v poradovníku.</p>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
                {stats?.upcomingSessions.slice(0, 10).map((session) => {
                  const pkg = PACKAGES.find(p => p.id === session.package_id);
                  const date = new Date(session.session_start);
                  return (
                    <div key={session.id} className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 group hover:border-white/20 transition-all text-left">
                      <div className="space-y-1">
                        <h4 className="font-black text-xl text-white tracking-tight">{session.client_name}</h4>
                        <div className="flex items-center gap-6 text-slate-300">
                          <p className="text-xs font-bold flex items-center gap-2">
                            <Phone size={12} className="text-white" /> {session.phone}
                          </p>
                          <p className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
                            <Calendar size={12} className="text-white" /> {date.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' })} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="px-3 py-1 rounded-full text-[9px] font-black bg-white/10 text-white uppercase tracking-widest border border-white/5">
                          {pkg?.name} {session.extra_hours > 0 && `(+${session.extra_hours}h)`}
                        </span>
                        <span className="text-2xl font-black text-emerald-400 tracking-tighter">€{session.calculated_price}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Sidebar: Tasks and Today summary */}
        <div className="lg:col-span-4 space-y-8">
          <GlassCard className="text-center p-8">
            <h3 className="text-lg font-black text-white mb-6 tracking-tight uppercase">Nedávne úlohy</h3>
            {stats?.pendingTasks.length === 0 ? (
              <p className="text-slate-400 italic py-6 text-center font-bold text-sm">Všetky úlohy sú hotové.</p>
            ) : (
              <div className="space-y-3">
                {stats?.pendingTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 text-left transition-colors hover:bg-white/10">
                    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-emerald-500'
                    }`} />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{task.title}</h4>
                      {task.assigned_to && (
                        <p className="text-[9px] text-slate-400 font-black flex items-center gap-1 mt-0.5 uppercase tracking-tighter">
                          <User size={10} /> {task.assigned_to}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 font-medium line-clamp-1">{task.description || "Bez popisu"}</p>
                    </div>
                  </div>
                ))}
                {stats && stats.pendingTasks.length > 5 && (
                  <button 
                    onClick={() => onNavigate('tasks')}
                    className="w-full text-center text-[10px] text-slate-400 hover:text-white transition-all pt-4 uppercase tracking-[0.3em] font-black"
                  >
                    Zobraziť všetky úlohy
                  </button>
                )}
              </div>
            )}
          </GlassCard>

          <GlassCard className="text-center p-8">
             <div className="flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-4">DNES</p>
                {stats?.todaySessions && stats.todaySessions.length > 0 ? (
                  <>
                    <span className="text-7xl font-black text-white leading-none">{stats.todaySessions.length}</span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-4">Sedenia</p>
                  </>
                ) : (
                  <div className="py-2">
                    <p className="text-slate-400 text-lg uppercase tracking-widest">Žiadne stretnutia.</p>
                  </div>
                )}
             </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{label: string, value: string, icon: any, color: string, sub: string}> = ({ label, value, icon: Icon, color, sub }) => (
  <GlassCard className="flex items-center gap-6 group hover:scale-[1.02] text-left p-6">
    <div className={`p-4 rounded-2xl bg-white/5 group-hover:bg-white/15 transition-all ${color}`}>
      <Icon size={24} strokeWidth={3} className="text-white" />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
      <h3 className="text-2xl font-black text-white mt-1 leading-none">{value}</h3>
      <p className="text-[9px] text-slate-500 mt-1.5 uppercase tracking-tighter font-black">{sub}</p>
    </div>
  </GlassCard>
);

export default Dashboard;