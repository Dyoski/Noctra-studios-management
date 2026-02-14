
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, CheckSquare, Calendar, BarChart3, LogOut } from 'lucide-react';

interface NavbarProps {
  activePage: string;
  onNavChange: (page: any) => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activePage, onNavChange, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Prehľad', icon: LayoutDashboard },
    { id: 'tasks', label: 'Úlohy', icon: CheckSquare },
    { id: 'calendar', label: 'Rezervácie', icon: Calendar },
    { id: 'revenue', label: 'Príjmy', icon: BarChart3 },
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-500 pt-8 pb-6 ${scrolled ? 'navbar-glass' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo */}
          <div 
            className="flex-shrink-0 flex items-center cursor-pointer group" 
            onClick={() => onNavChange('dashboard')}
          >
            <span className="text-4xl font-black tracking-tighter text-white">
              noctra <span className="text-slate-400 group-hover:text-white transition-colors">studios.</span>
            </span>
          </div>
          
          {/* Menu */}
          <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-xl">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavChange(item.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 transition-all duration-300 ${
                  activePage === item.id 
                    ? 'bg-white text-black shadow-lg shadow-white/10' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={14} strokeWidth={3} />
                <span>{item.label}</span>
              </button>
            ))}
            
            <div className="w-px h-6 bg-white/10 mx-2" />

            <button 
              onClick={onLogout}
              className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-white/10 rounded-xl transition-all"
              title="Odhlásiť sa"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
