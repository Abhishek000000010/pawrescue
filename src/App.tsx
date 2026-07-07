import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

// Layout
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Donate from './pages/Donate.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';

// Modals
import ReportModal from './components/ReportModal';
import VolunteerModal from './components/VolunteerModal';

const getRole = (): string | undefined => {
  try {
    return JSON.parse(localStorage.getItem('pawnet_user') || '{}').role;
  } catch {
    return undefined;
  }
};

// Regular users only. Admins are bounced to their dashboard so they never see
// the client-facing landing/app.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('pawnet_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (getRole() === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

// Admins only.
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('pawnet_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (getRole() !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppContent() {
  const [darkMode, setDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'community' | 'report' | 'adopt' | 'map' | 'missions'>('home');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [volunteerModalOpen, setVolunteerModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAdminPage = location.pathname.startsWith('/admin');
  const hideChrome = isAuthPage || isAdminPage;

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    if (view && ['home', 'community', 'report', 'adopt', 'map', 'missions'].includes(view)) {
      setCurrentView(view as any);
    }
  }, [location.search]);

  // "Become a Guardian" — active volunteering. Requires an account, then opens
  // the volunteer onboarding form (roles, location, code of conduct).
  const handleVolunteerClick = () => {
    const token = localStorage.getItem('pawnet_token');
    if (token) {
      setVolunteerModalOpen(true);
    } else {
      navigate('/login');
    }
  };

  // "Join the Community" — passive membership. New visitors register; existing
  // members are dropped straight into the community feed.
  const handleJoinClick = () => {
    const token = localStorage.getItem('pawnet_token');
    if (token) {
      setCurrentView('community');
      navigate('/');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className={`min-h-screen font-inter ${darkMode ? 'dark text-brand-light' : 'text-brand-dark'}`}>
      {!hideChrome && (
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
      )}

      <main className={!hideChrome ? "pt-20" : ""}>
        <Routes>
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home
                  onReportClick={() => setReportModalOpen(true)}
                  onAdoptClick={() => setCurrentView('adopt')}
                  onVolunteerClick={handleVolunteerClick}
                  onJoinClick={handleJoinClick}
                  onMapClick={() => setCurrentView('map')}
                  onMissionsClick={() => setCurrentView('missions')}
                  currentView={currentView}
                />
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </main>

      {!hideChrome && <Footer />}

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
