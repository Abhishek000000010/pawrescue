import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Award, Shield, CheckCircle2, Clock, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  points: number;
  badges: any[];
  missionsCompleted: number;
  catsRescued: number;
  createdAt: string;
  avatar?: string;
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

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myMissions, setMyMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
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
        const profileRes = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 min-h-screen">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Profile Card */}
        <div className="w-full md:w-1/3">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-dark rounded-3xl border border-white/10 p-8 text-center relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-brand-primary/20 to-brand-accent/5"></div>
            
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto bg-brand-primary/10 border-4 border-brand-dark rounded-full flex items-center justify-center mb-4">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-brand-primary" />
                )}
              </div>
              <h2 className="text-2xl font-black text-white">{profile.name}</h2>
              <p className="text-gray-400 text-sm mb-6">{profile.email}</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-brand-accent font-black text-2xl">{profile.points}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Points</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-brand-primary font-black text-2xl">{profile.missionsCompleted}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Rescues</div>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Badges & Missions */}
        <div className="w-full md:w-2/3 space-y-8">
          
          {/* Badges Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-brand-dark rounded-3xl border border-white/10 p-8"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-accent" /> Achievement Badges
            </h3>
            
            {profile.badges && profile.badges.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {profile.badges.map((badge, idx) => (
                  <div key={idx} className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                    <Shield className="w-8 h-8 text-brand-primary mx-auto mb-2" />
                    <div className="text-xs font-bold text-white">{badge.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/5">
                <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">Complete your first mission to earn a badge!</p>
              </div>
            )}
          </motion.div>

          {/* Active/Past Missions Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-brand-dark rounded-3xl border border-white/10 p-8"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-brand-primary" /> My Rescue Missions
            </h3>

            {myMissions.length > 0 ? (
              <div className="space-y-4">
                {myMissions.map((mission) => (
                  <div key={mission._id} className="bg-white/5 rounded-2xl p-5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-white">{mission.title}</h4>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-1">{mission.description}</p>
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
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-gray-400 font-medium mb-4">You haven't claimed any rescue missions yet.</p>
                <button 
                  onClick={() => navigate('/missions')}
                  className="px-6 py-2 bg-brand-primary hover:bg-brand-primary/90 text-brand-dark font-bold rounded-xl transition-colors"
                >
                  Browse Available Missions
                </button>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}
