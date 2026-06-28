import { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon, Sparkles, Heart, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DonationModal from './DonationModal';

interface HeaderProps {
  onReportClick: () => void;
  onAdoptClick: () => void;
  onVolunteerClick: () => void;
  onMapClick: () => void;
  onMissionsClick: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentView: 'home' | 'community' | 'report' | 'adopt' | 'map' | 'missions';
  onViewChange: (view: 'home' | 'community' | 'report' | 'adopt' | 'map' | 'missions') => void;
}

export default function Header({
  onReportClick,
  onAdoptClick,
  onVolunteerClick,
  onMapClick,
  onMissionsClick,
  darkMode,
  onToggleDarkMode,
  currentView,
  onViewChange,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const navigate = useNavigate();

  const userStr = localStorage.getItem('pawnet_user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home', action: () => onViewChange('home') },
    { label: 'Adopt', href: '#adopt', action: () => onViewChange('adopt') },
    { label: 'Report', href: '#report', action: () => onViewChange('report') },
    { label: 'Cat Map', href: '#map', action: () => onViewChange('map') },
    { label: 'Missions', href: '#missions', action: () => { onViewChange('home'); setTimeout(() => document.getElementById('missions')?.scrollIntoView({ behavior: 'smooth' }), 100); } },
    { label: 'Community', href: '#community', action: () => onViewChange('community') },
  ];

  return (
    <header
      id="header"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-brand-dark/95 backdrop-blur-md shadow-sm border-b border-brand-cream dark:border-brand-muted/20 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2 group focus:outline-none">
          <div className="h-9 w-9 rounded-xl bg-brand-primary flex items-center justify-center shadow-md shadow-brand-primary/10 group-hover:scale-105 transition-transform">
            <Heart className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="font-heading text-lg font-extrabold tracking-tight text-brand-dark dark:text-brand-light flex items-center gap-1">
            Paw <span className="text-brand-primary">Rescue</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = 
              (link.label === 'Home' && currentView === 'home') || 
              (link.label === 'Community' && currentView === 'community') ||
              (link.label === 'Report' && currentView === 'report') ||
              (link.label === 'Adopt' && currentView === 'adopt') ||
              (link.label === 'Cat Map' && currentView === 'map');
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  if (link.action) {
                    e.preventDefault();
                    link.action();
                  }
                }}
                className={`text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-brand-primary dark:text-brand-primary font-bold border-b-2 border-brand-primary pb-1'
                    : 'text-brand-dark/80 dark:text-brand-light/85 hover:text-brand-primary dark:hover:text-brand-primary'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Desktop Controls */}
        <div className="hidden lg:flex items-center gap-4">
          <button 
            onClick={() => setShowDonationModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-all font-black text-[10px] tracking-widest uppercase border border-brand-primary/20 hover:shadow-md"
          >
            <Heart className="h-3 w-3" /> Donate
          </button>
          
          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl border border-brand-cream dark:border-brand-muted/30 hover:bg-brand-cream dark:hover:bg-brand-muted/20 text-brand-dark dark:text-brand-light transition-all"
            aria-label="Toggle theme"
          >
            {darkMode ? <Moon className="h-4 w-4 text-brand-primary fill-brand-primary/10" /> : <Sun className="h-4 w-4 text-brand-primary fill-brand-primary/10" />}
          </button>

          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-xl bg-brand-primary/10 px-4 py-2 text-xs font-bold text-brand-primary hover:bg-brand-primary hover:text-brand-dark transition-all flex items-center gap-2"
            >
              <UserCircle className="h-4 w-4" /> {user.name}
            </button>
          ) : (
            <>
              <button
                onClick={onVolunteerClick}
                className="text-xs font-bold text-brand-dark dark:text-brand-light hover:text-brand-primary transition-colors px-4 py-2"
              >
                Login
              </button>
              <button
                onClick={onVolunteerClick}
                className="rounded-xl bg-brand-primary px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-primary/10 hover:bg-brand-primary-hover hover:shadow-brand-primary/20 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" /> Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile Controls Trigger */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-lg border border-brand-cream dark:border-brand-muted/30 text-brand-dark dark:text-brand-light"
          >
            {darkMode ? <Moon className="h-4 w-4 text-brand-primary" /> : <Sun className="h-4 w-4 text-brand-primary" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-brand-cream dark:border-brand-muted/30 text-brand-dark dark:text-brand-light hover:bg-brand-cream dark:hover:bg-brand-muted/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-brand-dark border-b border-brand-cream dark:border-brand-muted/20 shadow-xl py-6 px-6 space-y-4">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const isActive = 
                (link.label === 'Home' && currentView === 'home') || 
                (link.label === 'Community' && currentView === 'community') ||
                (link.label === 'Report' && currentView === 'report') ||
                (link.label === 'Adopt' && currentView === 'adopt') ||
                (link.label === 'Cat Map' && currentView === 'map');
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    if (link.action) {
                      e.preventDefault();
                      link.action();
                    }
                  }}
                  className={`text-sm font-semibold transition-colors ${
                    isActive 
                      ? 'text-brand-primary font-bold' 
                      : 'text-brand-dark dark:text-brand-light hover:text-brand-primary'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="flex gap-3 pt-4 border-t border-brand-cream dark:border-brand-muted/10">
            {user ? (
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
                className="flex-1 rounded-xl bg-brand-primary/10 py-2.5 text-xs font-bold text-brand-primary"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setMobileMenuOpen(false); onVolunteerClick(); }}
                  className="flex-1 rounded-xl border border-brand-cream dark:border-brand-muted/20 py-2.5 text-xs font-semibold text-brand-dark dark:text-brand-light"
                >
                  Login
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onVolunteerClick(); }}
                  className="flex-1 rounded-xl bg-brand-primary py-2.5 text-xs font-semibold text-white shadow-md"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <DonationModal isOpen={showDonationModal} onClose={() => setShowDonationModal(false)} />
    </header>
  );
}
