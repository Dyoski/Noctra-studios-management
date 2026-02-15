import React from 'react';
import { useBookingData } from '../context/BookingContext';
import GlassCard from '../components/GlassCard';
import { Play, Square, RotateCcw, Timer as TimerIcon } from 'lucide-react';

const TimerPage: React.FC = () => {
  const { timerSeconds, isTimerRunning, startTimer, stopTimer, resetTimer } = useBookingData();

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12">
      <header className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Session Timer</h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Meranie dĺžky nahrávania</p>
      </header>

      <GlassCard className="min-h-[500px] border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        <div className="space-y-12 flex flex-col items-center justify-center w-full">
           <div className="flex items-center justify-center gap-6 text-slate-500">
              <TimerIcon size={32} />
              <span className="text-sm font-black uppercase tracking-[0.5em]">Live Studio Time</span>
           </div>

           {/* Upravená veľkosť čísel pre lepšiu čitateľnosť a zarovnanie */}
           <div className={`text-[8rem] sm:text-[9rem] font-black tracking-tighter leading-none transition-all duration-700 tabular-nums flex items-center justify-center ${isTimerRunning ? 'text-white scale-105' : 'text-slate-700'}`}>
              {formatTime(timerSeconds)}
           </div>

           <div className="flex items-center justify-center gap-8 pt-6">
              {!isTimerRunning ? (
                <button 
                  onClick={startTimer}
                  className="w-24 h-24 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]"
                >
                  <Play size={40} fill="currentColor" />
                </button>
              ) : (
                <button 
                  onClick={stopTimer}
                  className="w-24 h-24 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-[0_0_50px_rgba(239,68,68,0.3)]"
                >
                  <Square size={40} fill="currentColor" />
                </button>
              )}
              
              <button 
                onClick={resetTimer}
                className="w-16 h-16 bg-white/5 border border-white/10 text-slate-400 rounded-full flex items-center justify-center hover:bg-white/10 hover:text-white transition-all"
                title="Resetovať"
              >
                <RotateCcw size={24} />
              </button>
           </div>
        </div>
      </GlassCard>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-3xl border border-white/5 space-y-2">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inštrukcia</p>
           <p className="text-sm text-slate-300 font-medium leading-relaxed">Časovač beží na pozadí. Môžete voľne prechádzať medzi sekciami aplikácie bez straty nameraného času.</p>
        </div>
        <div className="glass p-8 rounded-3xl border border-white/5 space-y-2">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</p>
           <p className="text-sm text-slate-300 font-medium leading-relaxed">
             {isTimerRunning ? 'Štúdio je momentálne AKTÍVNE. Nahrávanie prebieha.' : 'Časovač je POZASTAVENÝ.'}
           </p>
        </div>
      </div>
    </div>
  );
};

export default TimerPage;