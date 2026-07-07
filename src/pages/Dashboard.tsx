import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Award, Shield, CheckCircle2, Clock, LogOut, LayoutDashboard, Users, Heart, ClipboardList, Bell, Edit2, Lock, UserRound, Camera, Calendar, ChevronDown, CheckCircle, X } from 'lucide-react';
import { motion } from 'motion/react';
import { downloadReceipt } from '../utils/receipt';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  points: number;
  badges: any[];
  missionsCompleted: number;
  catsRescued: number;
  createdAt: string;
  role: string;
  avatar?: string;
  phone?: string;
  gender?: string;
  address?: string;
  dob?: string;
  location?: {
    city?: string;
    state?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };
  postalCode?: string;
  donations?: {
    _id: string;
    amount: number;
    transactionId: string;
    address: string;
    date: string;
  }[];
}

interface Mission {
  _id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  pointsReward: number;
  claimedBy?: { _id: string };
}

interface Inquiry {
  _id: string;
  catId: { _id: string; name: string; image?: string; colorMarkings?: string };
  userId: { _id: string; name: string; email: string };
  adopterName: string;
  adopterEmail: string;
  adopterPhone: string;
  experienceLevel: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myMissions, setMyMissions] = useState<Mission[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminCats, setAdminCats] = useState<any[]>([]);
  const [adminMissions, setAdminMissions] = useState<any[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [adminTab, setAdminTab] = useState<'overview' | 'adoptions' | 'users' | 'fosters' | 'cats' | 'missions' | 'notifications'>('overview');
  const [userTab, setUserTab] = useState<'personal' | 'security' | 'missions' | 'donations' | 'applications'>('personal');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    email: '',
    address: '',
    phoneCountryCode: '+91',
    phone: '',
    dob: '',
    location: '',
    postalCode: ''
  });
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('pawnet_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch Profile
        let profileData = null;
        const profileRes = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const parsePhone = (phoneStr: string | undefined) => {
          if (!phoneStr) return { countryCode: '+91', number: '' };
          const digitsOnly = phoneStr.replace(/\D/g, '');
          if (digitsOnly.length > 10) {
            const number = digitsOnly.slice(-10);
            const prefixDigits = digitsOnly.slice(0, -10);
            return { countryCode: `+${prefixDigits}`, number };
          }
          return { countryCode: '+91', number: digitsOnly };
        };

        if (profileRes.ok) {
          profileData = await profileRes.json();
          setProfile(profileData);
          const parsed = parsePhone(profileData.phone);
          setFormState(prev => ({
            ...prev,
            firstName: profileData.name.split(' ')[0] || '',
            lastName: profileData.name.split(' ').slice(1).join(' ') || '',
            email: profileData.email,
            phoneCountryCode: parsed.countryCode,
            phone: parsed.number,
            gender: profileData.gender || 'Male',
            address: profileData.address || '',
            dob: profileData.dob || '',
            location: profileData.location?.city || '',
            postalCode: profileData.postalCode || '',
          }));
        }

        // Fetch user's claimed/completed missions
        const missionsRes = await fetch('/api/missions');
        if (missionsRes.ok) {
          const allMissions = await missionsRes.json();
          const userStr = localStorage.getItem('pawnet_user');
          if (userStr) {
            const user = JSON.parse(userStr);
            const userMissions = allMissions.filter((m: Mission) => m.claimedBy?._id === user._id || m.claimedBy === user._id);
            setMyMissions(userMissions);
          }
        }

        // Fetch Adoption Inquiries
        if (profileData) {
          const inqRes = await fetch(profileData.role === 'admin' ? '/api/adoptions/all' : '/api/adoptions/my-inquiries', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (inqRes.ok) {
            setInquiries(await inqRes.json());
          }

          if (profileData.role === 'admin') {
            const [statsRes, usersRes, catsRes, missionsRes, notifRes] = await Promise.all([
              fetch('/api/auth/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
              fetch('/api/auth/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
              fetch('/api/cats'),
              fetch('/api/missions'),
              fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            if (statsRes.ok) setAdminStats(await statsRes.json());
            if (usersRes.ok) setAdminUsers(await usersRes.json());
            if (catsRes.ok) {
              const catData = await catsRes.json();
              setAdminCats(catData.cats || []);
            }
            if (missionsRes.ok) {
              setAdminMissions(await missionsRes.json());
            }
            if (notifRes.ok) {
              setAdminNotifications(await notifRes.json());
            }
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('pawnet_token');
    localStorage.removeItem('pawnet_user');
    navigate('/');
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
        setProfile(data);
      } else {
        alert(data.message || 'Avatar upload failed');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDownloadInvoice = (donation: any) => {
    downloadReceipt(donation, { name: profile?.name, email: profile?.email });
  };

  const handleSaveProfile = async () => {
    if (formState.phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formState.phone)) {
        alert('Please enter a valid 10-digit phone number.');
        return;
      }
    }

    if (formState.postalCode) {
      const postalRegex = /^[a-zA-Z0-9]{5,10}$/;
      if (!postalRegex.test(formState.postalCode)) {
        alert('Please enter a valid postal code (5 to 10 alphanumeric characters).');
        return;
      }
    }

    if (formState.dob) {
      const selectedDate = new Date(formState.dob);
      const today = new Date();
      if (isNaN(selectedDate.getTime())) {
        alert('Please enter a valid date of birth.');
        return;
      }
      if (selectedDate > today) {
        alert('Date of birth cannot be in the future.');
        return;
      }
    }

    try {
      const token = localStorage.getItem('pawnet_token');
      if (!token) return;

      const payload = {
        ...formState,
        phone: formState.phoneCountryCode + formState.phone
      };

      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('pawnet_user', JSON.stringify(data));
        setProfile(data);
        alert('Profile updated successfully!');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      alert('Error updating profile: ' + err.message);
    }
  };

  const handleDiscardChanges = () => {
    if (profile) {
      const parsePhone = (phoneStr: string | undefined) => {
        if (!phoneStr) return { countryCode: '+91', number: '' };
        const digitsOnly = phoneStr.replace(/\D/g, '');
        if (digitsOnly.length > 10) {
          const number = digitsOnly.slice(-10);
          const prefixDigits = digitsOnly.slice(0, -10);
          return { countryCode: `+${prefixDigits}`, number };
        }
        return { countryCode: '+91', number: digitsOnly };
      };

      const parsed = parsePhone(profile.phone);

      setFormState({
        firstName: profile.name.split(' ')[0] || '',
        lastName: profile.name.split(' ').slice(1).join(' ') || '',
        email: profile.email,
        phoneCountryCode: parsed.countryCode,
        phone: parsed.number,
        gender: (profile as any).gender || 'Male',
        address: (profile as any).address || '',
        dob: (profile as any).dob || '',
        location: profile.location?.city || '',
        postalCode: (profile as any).postalCode || '',
      });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const token = localStorage.getItem('pawnet_token');
      if (!token) return;

      const res = await fetch('/api/auth/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!res.ok) {
        const text = await res.text();
        let errorMessage = text;
        try {
          const parsed = JSON.parse(text);
          errorMessage = parsed.message || text;
        } catch {}
        alert('Failed to update password: ' + errorMessage);
        return;
      }

      await res.json();
      alert('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      alert('Error updating password: ' + err.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId: string, status: string) => {
    try {
      const token = localStorage.getItem('pawnet_token');
      const res = await fetch(`/api/adoptions/${inquiryId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setInquiries(prev => prev.map(inq => inq._id === inquiryId ? { ...inq, status: updated.status } : inq));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveMission = async (missionId: string) => {
    try {
      const token = localStorage.getItem('pawnet_token');
      const res = await fetch(`/api/missions/${missionId}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAdminMissions(prev => prev.map(m => m._id === missionId ? { ...m, status: 'completed' } : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectMission = async (missionId: string) => {
    try {
      const token = localStorage.getItem('pawnet_token');
      const res = await fetch(`/api/missions/${missionId}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAdminMissions(prev => prev.map(m => m._id === missionId ? { ...m, status: 'claimed' } : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      const token = localStorage.getItem('pawnet_token');
      await fetch('/api/notifications/read', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!profile) return null;

  // ----------------------------------------------------
  // ADMIN DASHBOARD
  // ----------------------------------------------------
  if (profile.role === 'admin') {
    return (
      <div className="fixed inset-0 z-[100] bg-zinc-50 dark:bg-zinc-950 flex overflow-hidden">
        {/* Admin Sidebar */}
        <div className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full shrink-0">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <Shield className="w-8 h-8 text-brand-primary" />
            <div>
              <div className="font-black text-brand-dark dark:text-brand-light leading-none">PawNet</div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-brand-primary mt-1">Admin Portal</div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button onClick={() => setAdminTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${adminTab === 'overview' ? 'bg-brand-primary text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </button>
            <button onClick={() => setAdminTab('adoptions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${adminTab === 'adoptions' ? 'bg-brand-primary text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              <Heart className="w-5 h-5" /> Adoptions
            </button>
            <button onClick={() => setAdminTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${adminTab === 'users' ? 'bg-brand-primary text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              <Users className="w-5 h-5" /> Users
            </button>
            <button onClick={() => setAdminTab('fosters')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${adminTab === 'fosters' ? 'bg-brand-primary text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              <Shield className="w-5 h-5" /> Fosters
            </button>
            <button onClick={() => setAdminTab('cats')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${adminTab === 'cats' ? 'bg-brand-primary text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              <ClipboardList className="w-5 h-5" /> Reported Cats
            </button>
            <button onClick={() => setAdminTab('missions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${adminTab === 'missions' ? 'bg-brand-primary text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              <Award className="w-5 h-5" /> Validate Missions
            </button>
            <button 
              onClick={() => { setAdminTab('notifications'); handleMarkNotificationsRead(); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors justify-between ${adminTab === 'notifications' ? 'bg-brand-primary text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" /> Notifications
              </div>
              {adminNotifications.filter(n => !n.isRead).length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {adminNotifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
          </nav>
          
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <button onClick={handleLogout} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {adminTab === 'overview' && adminStats && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-black text-brand-dark dark:text-brand-light mb-6">Platform Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 border-l-4 border-l-brand-primary">
                  <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Reported Cats</div>
                  <div className="text-4xl font-black text-brand-dark dark:text-brand-light">{adminStats.totalCats}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 border-l-4 border-l-blue-500">
                  <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Total Users</div>
                  <div className="text-4xl font-black text-brand-dark dark:text-brand-light">{adminStats.totalUsers}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 border-l-4 border-l-purple-500">
                  <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Volunteers</div>
                  <div className="text-4xl font-black text-brand-dark dark:text-brand-light">{adminStats.totalVolunteers}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 border-l-4 border-l-green-500">
                  <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Fosters</div>
                  <div className="text-4xl font-black text-brand-dark dark:text-brand-light">{adminStats.totalFosters}</div>
                </div>
              </div>
            </motion.div>
          )}

          {adminTab === 'missions' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-black text-brand-dark dark:text-brand-light mb-6">Validate Mission Proofs</h2>
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
                {adminMissions.filter(m => m.status === 'pending_approval').length > 0 ? (
                  <div className="space-y-4">
                    {adminMissions.filter(m => m.status === 'pending_approval').map(mission => (
                      <div key={mission._id} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800/30 flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-wider">
                              {mission.type}
                            </span>
                            <span className="text-xs font-bold text-brand-accent">+{mission.pointsReward} Points</span>
                          </div>
                          <h4 className="font-bold text-brand-dark dark:text-brand-light">{mission.title}</h4>
                          <p className="text-sm text-zinc-500 mt-1">Claimed by: <span className="font-bold">{mission.claimedBy?.name}</span></p>
                          
                          {mission.completionNotes && (
                            <div className="mt-3 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm italic text-zinc-600 dark:text-zinc-400">
                              "{mission.completionNotes}"
                            </div>
                          )}
                        </div>
                        
                        {mission.completionProof && mission.completionProof[0] && (
                          <div className="shrink-0 w-32 h-32 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                            <a href={mission.completionProof[0]} target="_blank" rel="noreferrer">
                              <img src={mission.completionProof[0]} alt="Proof" className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer" title="Click to view full image" />
                            </a>
                          </div>
                        )}

                        <div className="flex flex-col gap-2 shrink-0 md:w-32">
                          <button onClick={() => handleApproveMission(mission._id)} className="w-full px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </button>
                          <button onClick={() => handleRejectMission(mission._id)} className="w-full px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-1">
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 font-medium text-sm text-center py-8">No missions pending approval.</p>
                )}
              </div>
            </motion.div>
          )}

          {adminTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-black text-brand-dark dark:text-brand-light">System Notifications</h2>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
                {adminNotifications.length > 0 ? (
                  <div className="space-y-3">
                    {adminNotifications.map(notification => (
                      <div key={notification._id} className={`p-4 rounded-xl border ${notification.isRead ? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800' : 'bg-brand-primary/5 border-brand-primary/20'}`}>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {notification.type === 'cat_reported' && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase">Cat Reported</span>}
                              {notification.type === 'user_registered' && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">New User</span>}
                              {notification.type === 'foster_added' && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold uppercase">New Foster</span>}
                              {notification.type === 'adoption_inquiry' && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase">Adoption</span>}
                              {!notification.isRead && <span className="w-2 h-2 rounded-full bg-brand-accent"></span>}
                            </div>
                            <h4 className="font-bold text-sm text-brand-dark dark:text-brand-light">{notification.title}</h4>
                            <p className="text-xs text-zinc-500 mt-1">{notification.message}</p>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 font-medium text-sm text-center py-8">No notifications yet.</p>
                )}
              </div>
            </motion.div>
          )}

          {adminTab === 'adoptions' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-black text-brand-dark dark:text-brand-light mb-6">Adoption Inquiries</h2>
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
                {inquiries.length > 0 ? (
                  <div className="space-y-4">
                    {inquiries.slice().reverse().map((inquiry) => (
                      <div key={inquiry._id} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex gap-4 items-center">
                          <img src={inquiry.catId?.image || 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=150'} alt="cat" className="w-14 h-14 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700" />
                          <div>
                            <h4 className="font-bold text-brand-dark dark:text-brand-light flex items-center gap-2">
                              {inquiry.catId?.name || 'Unknown Cat'}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                inquiry.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                inquiry.status === 'reviewing' ? 'bg-blue-100 text-blue-700' :
                                inquiry.status === 'approved' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {inquiry.status}
                              </span>
                            </h4>
                            <p className="text-xs text-zinc-500 mt-1">
                              Applicant: {inquiry.adopterName} ({inquiry.experienceLevel === 'yes' ? 'Experienced' : 'First-time'}) • {inquiry.adopterEmail}
                            </p>
                          </div>
                        </div>
                        {inquiry.status !== 'approved' && inquiry.status !== 'rejected' && (
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => handleUpdateInquiryStatus(inquiry._id, 'approved')} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors">
                              Approve
                            </button>
                            <button onClick={() => handleUpdateInquiryStatus(inquiry._id, 'rejected')} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors">
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 font-medium text-sm text-center py-8">No adoption inquiries received yet.</p>
                )}
              </div>
            </motion.div>
          )}

          {adminTab === 'users' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-black text-brand-dark dark:text-brand-light mb-6">Registered Users</h2>
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="space-y-3">
                  {adminUsers.map(u => (
                    <div key={u._id} className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <div className="font-bold text-sm text-brand-dark dark:text-brand-light">{u.name}</div>
                        <div className="text-xs text-zinc-500">{u.email}</div>
                      </div>
                      <span className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-300">
                        {u.role || 'citizen'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {adminTab === 'fosters' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-black text-brand-dark dark:text-brand-light mb-6">Registered Fosters</h2>
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="space-y-3">
                  {adminUsers.filter(u => u.volunteerRoles?.includes('foster') || u.role === 'foster').map(u => (
                    <div key={u._id} className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <div className="font-bold text-sm text-brand-dark dark:text-brand-light">{u.name}</div>
                        <div className="text-xs text-zinc-500">{u.email}</div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 rounded text-[10px] font-bold uppercase text-green-700">
                        Active Foster
                      </span>
                    </div>
                  ))}
                  {adminUsers.filter(u => u.volunteerRoles?.includes('foster') || u.role === 'foster').length === 0 && (
                    <p className="text-center text-sm text-zinc-500 py-4">No registered fosters found.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {adminTab === 'cats' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-black text-brand-dark dark:text-brand-light mb-6">Reported Cats</h2>
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminCats.map(cat => (
                  <div key={cat._id} className="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <img src={cat.photos?.[0] || 'https://via.placeholder.com/150'} alt="cat" className="w-16 h-16 rounded-xl object-cover" />
                    <div>
                      <div className="font-bold text-sm text-brand-dark dark:text-brand-light">{cat.name || 'Unknown'}</div>
                      <div className="text-xs text-zinc-500 mt-1">{cat.status}</div>
                      <div className="text-[10px] font-bold text-brand-primary uppercase mt-1">{cat.severity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // USER DASHBOARD (Citizens / Volunteers)
  // ----------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 min-h-screen">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Column: Settings Navigation Profile Card */}
        <div className="w-full md:w-[300px] shrink-0 bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 relative">
          <div className="flex flex-col items-center pt-2 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-700 shadow-sm">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#ED8A3E] text-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-[#D97706] transition-colors border-2 border-white dark:border-zinc-900">
                {uploadingAvatar ? <span className="animate-spin text-[10px] block w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> : <Edit2 className="w-4 h-4" />}
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{profile.name}</h2>
            <p className="text-sm font-medium text-zinc-500 capitalize">{profile.role || 'Citizen'}</p>
          </div>

          <div className="pt-4 space-y-2">
            <button
              onClick={() => setUserTab('personal')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                userTab === 'personal'
                  ? 'bg-[#FEF2E8] dark:bg-[#ED8A3E]/10 text-[#ED8A3E]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <UserRound className="w-5 h-5" /> Personal Information
            </button>
            <button
              onClick={() => setUserTab('missions')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                userTab === 'missions'
                  ? 'bg-[#FEF2E8] dark:bg-[#ED8A3E]/10 text-[#ED8A3E]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Shield className="w-5 h-5" /> Rescues & Badges
            </button>
            <button
              onClick={() => setUserTab('donations')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                userTab === 'donations'
                  ? 'bg-[#FEF2E8] dark:bg-[#ED8A3E]/10 text-[#ED8A3E]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Heart className="w-5 h-5" /> Donations
            </button>
            <button
              onClick={() => setUserTab('applications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                userTab === 'applications'
                  ? 'bg-[#FEF2E8] dark:bg-[#ED8A3E]/10 text-[#ED8A3E]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <ClipboardList className="w-5 h-5" /> Applications
            </button>
            <button
              onClick={() => setUserTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                userTab === 'security'
                  ? 'bg-[#FEF2E8] dark:bg-[#ED8A3E]/10 text-[#ED8A3E]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Lock className="w-5 h-5" /> Login & Password
            </button>
            
            <div className="pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" /> Log Out
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Form/Content Area */}
        <div className="flex-1 w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 min-h-[500px]">
          
          {userTab === 'personal' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-6">Personal Information</h3>
              
              <div className="space-y-6">
                {/* Gender Toggle */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer" onClick={() => setFormState(s => ({...s, gender: 'Male'}))}>
                    <div className="relative flex items-center justify-center w-5 h-5 border rounded-full border-zinc-300 dark:border-zinc-600">
                      {formState.gender === 'Male' && <div className="w-2.5 h-2.5 bg-[#ED8A3E] rounded-full" />}
                      {formState.gender === 'Male' && <div className="absolute inset-0 border-2 border-[#ED8A3E] rounded-full pointer-events-none" />}
                    </div>
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Male</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer" onClick={() => setFormState(s => ({...s, gender: 'Female'}))}>
                    <div className="relative flex items-center justify-center w-5 h-5 border rounded-full border-zinc-300 dark:border-zinc-600">
                      {formState.gender === 'Female' && <div className="w-2.5 h-2.5 bg-[#ED8A3E] rounded-full" />}
                      {formState.gender === 'Female' && <div className="absolute inset-0 border-2 border-[#ED8A3E] rounded-full pointer-events-none" />}
                    </div>
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Female</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500">First Name</label>
                    <input type="text" value={formState.firstName} onChange={e => setFormState(s => ({...s, firstName: e.target.value}))} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border-none rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-[#ED8A3E]/50 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500">Last Name</label>
                    <input type="text" value={formState.lastName} onChange={e => setFormState(s => ({...s, lastName: e.target.value}))} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border-none rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-[#ED8A3E]/50 outline-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Email</label>
                  <div className="relative">
                    <input type="email" value={formState.email} readOnly className="w-full pl-4 pr-24 py-3 bg-zinc-50 dark:bg-zinc-950/50 border-none rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-100 focus:outline-none" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-500">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-bold">Verified</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Address</label>
                  <input type="text" value={formState.address} onChange={e => setFormState(s => ({...s, address: e.target.value}))} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border-none rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-[#ED8A3E]/50 outline-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="relative shrink-0 w-28">
                        <select 
                          value={formState.phoneCountryCode} 
                          onChange={e => setFormState(s => ({...s, phoneCountryCode: e.target.value}))} 
                          className="w-full px-3 py-3 bg-zinc-50 dark:bg-zinc-950/50 border-none rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-[#ED8A3E]/50 outline-none appearance-none"
                        >
                          <option value="+91">+91 (IN)</option>
                          <option value="+1">+1 (US)</option>
                          <option value="+44">+44 (UK)</option>
                          <option value="+61">+61 (AU)</option>
                          <option value="+81">+81 (JP)</option>
                          <option value="+49">+49 (DE)</option>
                          <option value="+33">+33 (FR)</option>
                          <option value="+971">+971 (AE)</option>
                          <option value="+65">+65 (SG)</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <input 
                        type="text" 
                        value={formState.phone} 
                        maxLength={10}
                        onChange={e => setFormState(s => ({...s, phone: e.target.value.replace(/\D/g, '')}))} 
                        placeholder="Phone Number"
                        className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border-none rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-[#ED8A3E]/50 outline-none" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500">Date of Birth</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={formState.dob ? formState.dob.substring(0, 10) : ''} 
                        max={new Date().toISOString().split('T')[0]}
                        onChange={e => setFormState(s => ({...s, dob: e.target.value}))} 
                        className="w-full pl-4 pr-10 py-3 bg-zinc-50 dark:bg-zinc-950/50 border-none rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-[#ED8A3E]/50 outline-none" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500">Location</label>
                    <div className="relative">
                      <select value={formState.location} onChange={e => setFormState(s => ({...s, location: e.target.value}))} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border-none rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-[#ED8A3E]/50 outline-none appearance-none">
                        <option value="">Select Location</option>
                        <option value="Delhi, IN">Delhi, IN</option>
                        <option value="Mumbai, IN">Mumbai, IN</option>
                        <option value="Bangalore, IN">Bangalore, IN</option>
                        <option value="Kolkata, IN">Kolkata, IN</option>
                        <option value="Chennai, IN">Chennai, IN</option>
                        <option value="New York, USA">New York, USA</option>
                        <option value="San Francisco, USA">San Francisco, USA</option>
                        <option value="Atlanta, USA">Atlanta, USA</option>
                        <option value="London, UK">London, UK</option>
                        <option value="Toronto, CA">Toronto, CA</option>
                        <option value="Sydney, AU">Sydney, AU</option>
                        <option value="Tokyo, JP">Tokyo, JP</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500">Postal Code</label>
                    <input 
                      type="text" 
                      value={formState.postalCode} 
                      onChange={e => setFormState(s => ({...s, postalCode: e.target.value.replace(/[^a-zA-Z0-9]/g, '')}))} 
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border-none rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-[#ED8A3E]/50 outline-none" 
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button 
                    onClick={handleDiscardChanges}
                    className="px-6 py-2.5 rounded-xl border border-[#ED8A3E] text-[#ED8A3E] text-sm font-bold hover:bg-[#ED8A3E]/5 transition-colors"
                  >
                    Discard Changes
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    className="px-6 py-2.5 rounded-xl bg-[#ED8A3E] text-white text-sm font-bold hover:bg-[#D97706] transition-colors shadow-md shadow-[#ED8A3E]/20"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {userTab === 'security' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-6">Login & Password</h3>
              
              <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Current Password</label>
                  <input 
                    type="password" 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)} 
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border-none rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-[#ED8A3E]/50 outline-none" 
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border-none rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-[#ED8A3E]/50 outline-none" 
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border-none rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-[#ED8A3E]/50 outline-none" 
                    required
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    type="submit" 
                    disabled={updatingPassword}
                    className="px-6 py-2.5 rounded-xl bg-[#ED8A3E] text-white text-sm font-bold hover:bg-[#D97706] transition-colors shadow-md shadow-[#ED8A3E]/20 disabled:opacity-50"
                  >
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {userTab === 'missions' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-brand-dark dark:text-brand-light mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6 text-brand-accent" /> Achievement Badges
                </h3>
                {profile.badges && profile.badges.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {profile.badges.map((badge, idx) => (
                      <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 text-center border border-zinc-100 dark:border-zinc-800/30">
                        <Shield className="w-8 h-8 text-brand-primary mx-auto mb-2" />
                        <div className="text-xs font-bold text-brand-dark dark:text-brand-light">{badge.name}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/30">
                    <Shield className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                    <p className="text-zinc-500 font-medium text-sm">Complete your first mission to earn a badge!</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-brand-dark dark:text-brand-light mb-6 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-brand-primary" /> My Rescue Missions
                </h3>
                {myMissions.length > 0 ? (
                  <div className="space-y-4">
                    {myMissions.map((mission) => (
                      <div key={mission._id} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-brand-dark dark:text-brand-light">{mission.title}</h4>
                          <p className="text-sm text-zinc-500 mt-1 line-clamp-1">{mission.description}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-brand-accent font-bold text-sm">+{mission.pointsReward} pts</span>
                          {mission.status === 'completed' ? (
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-green-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          ) : (
                            <span className="bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full text-xs font-bold border border-brand-primary/20">
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/30">
                    <p className="text-zinc-500 font-medium mb-4 text-sm">You haven't claimed any rescue missions yet.</p>
                    <button 
                      onClick={() => navigate('/?view=missions')}
                      className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black rounded-xl transition-colors uppercase tracking-wider shadow-md"
                    >
                      Browse Available Missions
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {userTab === 'donations' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-xl font-bold text-brand-dark dark:text-brand-light mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg> 
                Donation History & Invoices
              </h3>
              {profile.donations && profile.donations.length > 0 ? (
                <div className="space-y-4">
                  {profile.donations.slice().reverse().map((donation) => (
                    <div key={donation._id || donation.transactionId} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-brand-dark dark:text-brand-light">₹{donation.amount} Donation</h4>
                        <p className="text-xs text-zinc-500 mt-1">
                          {new Date(donation.date).toLocaleDateString()} • {donation.transactionId}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <button 
                          onClick={() => handleDownloadInvoice(donation)}
                          className="px-4 py-2 bg-brand-dark hover:bg-brand-dark/90 dark:bg-brand-light dark:hover:bg-brand-cream text-white dark:text-brand-dark text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                          Invoice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/30">
                  <p className="text-zinc-500 font-medium text-sm">You haven't made any donations yet.</p>
                </div>
              )}
            </motion.div>
          )}

          {userTab === 'applications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-xl font-bold text-brand-dark dark:text-brand-light mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary"><path d="M12 21a9.002 9.002 0 0 0 8.716-6.747M12 21a9.002 9.002 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.974 0-5.742-.98-7.843-2.668m15.686 0A5.002 5.002 0 0 1 15 15h-1"/></svg>
                My Adoption Applications
              </h3>
              {inquiries && inquiries.length > 0 ? (
                <div className="space-y-4">
                  {inquiries.slice().reverse().map((inquiry) => (
                    <div key={inquiry._id} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex gap-4 items-center">
                        <img src={inquiry.catId?.image || 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=150'} alt="cat" className="w-14 h-14 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700" />
                        <div>
                          <h4 className="font-bold text-brand-dark dark:text-brand-light flex items-center gap-2">
                            {inquiry.catId?.name || 'Unknown Cat'}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              inquiry.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              inquiry.status === 'reviewing' ? 'bg-blue-100 text-blue-700' :
                              inquiry.status === 'approved' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {inquiry.status}
                            </span>
                          </h4>
                          <p className="text-xs text-zinc-500 mt-1">
                            Applicant: {inquiry.adopterName} ({inquiry.experienceLevel === 'yes' ? 'Experienced' : 'First-time'})
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/30">
                  <p className="text-zinc-500 font-medium text-sm">
                    You haven't submitted any adoption applications yet.
                  </p>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
