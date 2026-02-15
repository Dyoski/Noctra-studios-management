import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Bookings from './pages/Bookings';
import Revenue from './pages/Revenue';
import Clients from './pages/Clients';
import TimerPage from './pages/Timer';
import Login from './pages/Login';
import Register from './pages/Register';
import { BookingProvider, useBookingData } from './context/BookingContext';
import { Timer as TimerIcon } from 'lucide-react';

enum Page {
  Dashboard = 'dashboard',
  Tasks = 'tasks',
  Calendar = 'calendar',
  Revenue = 'revenue',
  Clients = 'clients',
  Timer = 'timer'
}

type AuthMode = 'login' | 'register';

// Samostatný komponent pre mini timer aby mal prístup k hookom
const GlobalTimerOverlay: React.FC<{ activePage: string }> = ({ activePage }) => {
  const { timerSeconds, isTimerRunning } = useBookingData();
  
  if (!isTimerRunning || activePage === Page.Timer) return null;

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-right-4 duration-500">
      <div className="glass px-6 py-3 rounded-2xl border-white/20 flex items-center gap-4 shadow-2xl">
        <div className="relative">
           <TimerIcon size={18} className="text-white animate-pulse" />
           <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        </div>
        <span className="text-lg font-black tracking-tighter text-white tabular-nums">
          {formatTime(timerSeconds)}
        </span>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Dashboard);
  const [activeParams, setActiveParams] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  useEffect(() => {
    const loggedIn = localStorage.getItem('noctra_auth');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('noctra_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('noctra_auth');
    setIsAuthenticated(false);
    setActivePage(Page.Dashboard);
  };

  const navigateTo = (page: string, params: any = null) => {
    setActivePage(page as Page);
    setActiveParams(params);
  };

  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <Login onLogin={handleLogin} onToggleMode={() => setAuthMode('register')} />
    ) : (
      <Register onToggleMode={() => setAuthMode('login')} />
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case Page.Dashboard: return <Dashboard onNavigate={navigateTo} />;
      case Page.Tasks: return <Tasks />;
      case Page.Calendar: return <Bookings />;
      case Page.Timer: return <TimerPage />;
      case Page.Revenue: return <Revenue onNavigate={navigateTo} />;
      case Page.Clients: return <Clients initialClientId={activeParams?.clientId} />;
      default: return <Dashboard onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen transition-all duration-300 ease-in-out">
      <GlobalTimerOverlay activePage={activePage} />
      <Navbar 
        activePage={activePage} 
        onNavChange={(p) => navigateTo(p)} 
        onLogout={handleLogout} 
      />
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        {renderPage()}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <BookingProvider>
    <AppContent />
  </BookingProvider>
);

export default App;