
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';

interface LoginProps {
  onLogin: () => void;
  onToggleMode: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onToggleMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  useEffect(() => {
    if (formData.email) {
      setEmailValid(validateEmail(formData.email));
    } else {
      setEmailValid(null);
    }
  }, [formData.email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailValid && formData.password.length >= 6) {
      setIsSubmitting(true);
      // Simulácia autentifikácie
      setTimeout(() => {
        setIsSubmitting(false);
        onLogin();
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-700">
        <header className="text-center mb-10 space-y-2">
          <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic">Noctra</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.5em]">Studio Access</p>
        </header>

        <GlassCard className="p-10 border-white/10 shadow-[0_0_80px_rgba(255,255,255,0.02)] rounded-[3rem]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={18} />
                <input 
                  type="email"
                  required
                  placeholder="meno@noctra.sk"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full bg-white/5 border-2 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none transition-all font-bold placeholder:text-slate-700 ${
                    emailValid === false ? 'border-red-500/30' : 'border-white/5 focus:border-white/20'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Heslo</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:border-white/20 transition-all font-bold placeholder:text-slate-700"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                disabled={!emailValid || formData.password.length < 6 || isSubmitting}
                className={`w-full py-5 rounded-3xl font-black uppercase text-[11px] tracking-[0.4em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl ${
                  emailValid && formData.password.length >= 6 && !isSubmitting
                  ? 'bg-white text-black hover:bg-slate-200 shadow-white/5'
                  : 'bg-white/5 text-slate-500 cursor-not-allowed border-2 border-white/5'
                }`}
              >
                <span>{isSubmitting ? 'Overujem...' : 'Vstúpiť'}</span>
                {!isSubmitting && <ArrowRight size={16} strokeWidth={3} />}
              </button>
            </div>
          </form>

          <footer className="mt-8 text-center">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              Nemáte prístup? <button onClick={onToggleMode} className="text-white hover:underline transition-all">Požiadať o registráciu</button>
            </p>
          </footer>
        </GlassCard>
      </div>
    </div>
  );
};

export default Login;
