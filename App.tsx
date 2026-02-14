
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Bookings from './pages/Bookings';
import Revenue from './pages/Revenue';
import Login from './pages/Login';
import Register from './pages/Register';
import { BookingProvider } from './context/BookingContext';

enum Page {
  Dashboard = 'dashboard',
  Tasks = 'tasks',
  Calendar = 'calendar',
  Revenue = 'revenue'
}

type AuthMode = 'login' | 'register';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Dashboard);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Kontrola prihlásenia pri štarte (simulácia cez localStorage)
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

  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <Login onLogin={handleLogin} onToggleMode={() => setAuthMode('register')} />
    ) : (
      <Register onToggleMode={() => setAuthMode('login')} />
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case Page.Dashboard: return <Dashboard onNavigate={(p: any) => setActivePage(p)} />;
      case Page.Tasks: return <Tasks />;
      case Page.Calendar: return <Bookings />;
      case Page.Revenue: return <Revenue />;
      default: return <Dashboard onNavigate={(p: any) => setActivePage(p)} />;
    }
  };

  return (
    <BookingProvider>
      <div className="min-h-screen transition-all duration-300 ease-in-out">
        <Navbar 
          activePage={activePage} 
          onNavChange={setActivePage} 
          onLogout={handleLogout} 
        />
        <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
          {renderPage()}
        </main>
      </div>
    </BookingProvider>
  );
};

export default App;
