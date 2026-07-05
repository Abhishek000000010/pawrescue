import { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon, Sparkles, Heart, UserCircle, LogOut, Camera, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

  const handleLogout = () => {
    localStorage.removeItem('pawnet_token');
    localStorage.removeItem('pawnet_user');
    window.location.href = '/login';
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const token = localStorage.getItem('pawnet_token');
    if (!token) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const response = await fetch('/api/auth/me/avatar', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('pawnet_user', JSON.stringify(data));
        window.location.reload();
      } else {
        alert(data.message || 'Avatar upload failed');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const navLinks = [
    { label: 'Home', href: '#home', action: () => onViewChange('home') },
    { label: 'Adopt', href: '#adopt', action: () => onViewChange('adopt') },
    { label: 'Report', href: '#report', action: () => onViewChange('report') },
    { label: 'Cat Map', href: '#map', action: () => onViewChange('map') },
    { label: 'Missions', href: '#missions', action: () => onViewChange('missions') },
    { label: 'Community', href: '#community', action: () => onViewChange('community') },
  ];

  return (
    <header
      id="header"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled
          ? 'glass py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center group focus:outline-none">
          <Logo className="text-2xl group-hover:scale-105 transition-transform duration-300" onDark={darkMode} />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = 
              (link.label === 'Home' && currentView === 'home') || 
              (link.label === 'Community' && currentView === 'community') ||
              (link.label === 'Report' && currentView === 'report') ||
              (link.label === 'Adopt' && currentView === 'adopt') ||
              (link.label === 'Missions' && currentView === 'missions') ||
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
            onClick={() => navigate('/donate')}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary dark:text-white hover:bg-brand-primary hover:text-white transition-all font-bold text-[11px] tracking-widest uppercase border border-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/30 hover:-translate-y-0.5"
          >
            <Heart className="h-3.5 w-3.5" /> Donate
          </button>
          
          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
            aria-label="Toggle theme"
          >
            {darkMode ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="rounded-xl bg-brand-primary/10 px-4 py-2 text-xs font-bold text-brand-primary hover:bg-brand-primary hover:text-white transition-all flex items-center gap-2"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="Profile" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <UserCircle className="h-5 w-5" />
                )}
                {user.name.split(' ')[0]}
                <ChevronDown className={`h-3 w-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 mb-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                  
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/dashboard'); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-brand-primary transition-colors flex items-center gap-2"
                  >
                    <UserCircle className="h-4 w-4" /> Dashboard
                  </button>

                  <label className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-brand-primary transition-colors flex items-center gap-2 cursor-pointer">
                    <Camera className="h-4 w-4" /> {uploadingAvatar ? 'Uploading...' : 'Update Photo'}
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>

                  <div className="border-t border-slate-100 dark:border-slate-700 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-brand-primary dark:hover:text-white transition-colors px-4 py-2"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" /> Sign Up
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
        <div className="lg:hidden absolute top-full left-0 right-0 glass border-t border-zinc-200 dark:border-zinc-800 shadow-2xl py-6 px-6 space-y-4">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const isActive = 
                (link.label === 'Home' && currentView === 'home') || 
                (link.label === 'Community' && currentView === 'community') ||
                (link.label === 'Report' && currentView === 'report') ||
                (link.label === 'Adopt' && currentView === 'adopt') ||
                (link.label === 'Missions' && currentView === 'missions') ||
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

          <div className="flex flex-col gap-3 pt-4 border-t border-brand-cream dark:border-brand-muted/10">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-2 py-2">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <UserCircle className="h-10 w-10 text-brand-primary" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
                    className="flex-1 rounded-xl bg-brand-primary/10 py-2.5 text-xs font-bold text-brand-primary"
                  >
                    Dashboard
                  </button>
                  <label className="flex-1 rounded-xl border border-brand-cream dark:border-brand-muted/20 py-2.5 text-xs font-semibold text-brand-dark dark:text-brand-light flex items-center justify-center gap-1.5 cursor-pointer">
                    <Camera className="h-3.5 w-3.5" /> Photo
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                  <button
                    onClick={handleLogout}
                    className="rounded-xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 px-4 py-2.5 flex items-center justify-center"
                    aria-label="Log out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
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

    </header>
  );
}
