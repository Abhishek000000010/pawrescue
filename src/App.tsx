import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

// Layout
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Dashboard from './pages/Dashboard.tsx';

// Modals
import ReportModal from './components/ReportModal';
import VolunteerModal from './components/VolunteerModal';

function AppContent() {
  const [darkMode, setDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'community' | 'report' | 'adopt' | 'map' | 'missions'>('home');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [volunteerModalOpen, setVolunteerModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleVolunteerClick = () => {
    navigate('/login');
  };

  return (
    <div className={`min-h-screen font-inter ${darkMode ? 'dark bg-brand-dark text-brand-light' : 'bg-brand-light text-brand-dark'}`}>
      <Header
        onReportClick={() => setReportModalOpen(true)}
        onAdoptClick={() => setCurrentView('adopt')}
        onVolunteerClick={handleVolunteerClick}
        onMapClick={() => setCurrentView('map')}
        onMissionsClick={() => setCurrentView('missions')}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          navigate('/');
        }}
      />

      <main className="pt-20">
        <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                onReportClick={() => setReportModalOpen(true)}
                onAdoptClick={() => setCurrentView('adopt')}
                onVolunteerClick={handleVolunteerClick}
                currentView={currentView}
              />
            } 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>

      <Footer />

      {/* Modals */}
      {reportModalOpen && <ReportModal isOpen={true} onClose={() => setReportModalOpen(false)} onReportSuccess={() => setReportModalOpen(false)} />}
      {volunteerModalOpen && <VolunteerModal isOpen={true} onClose={() => setVolunteerModalOpen(false)} />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
