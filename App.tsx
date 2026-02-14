
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Bookings from './pages/Bookings';
import Revenue from './pages/Revenue';
import { BookingProvider } from './context/BookingContext';

enum Page {
  Dashboard = 'dashboard',
  Tasks = 'tasks',
  Calendar = 'calendar',
  Revenue = 'revenue'
}

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Dashboard);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  if (isLoggedOut) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="glass p-8 rounded-2xl w-full max-w-md text-center">
          <h1 className="text-3xl font-extrabold mb-4 tracking-tighter">noctra studios</h1>
          <p className="text-slate-400 mb-6">Management Session Ended</p>
          <button 
            onClick={() => setIsLoggedOut(false)}
            className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Re-Login
          </button>
        </div>
      </div>
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
          onLogout={() => setIsLoggedOut(true)} 
        />
        <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
          {renderPage()}
        </main>
      </div>
    </BookingProvider>
  );
};

export default App;
