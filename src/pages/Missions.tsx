import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { MapPin, Clock, ArrowRight, CheckCircle2, ShieldAlert, UploadCloud, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Mission {
  _id: string;
  type: string;
  title: string;
  description: string;
  status: 'open' | 'claimed' | 'in_progress' | 'completed' | 'cancelled';
  pointsReward: number;
  urgency: 'urgent' | 'normal' | 'low';
  createdAt: string;
  cat?: {
    _id: string;
    photos: string[];
  };
  location?: {
    address: string;
  };
  claimedBy?: {
    _id: string;
    name: string;
  };
}

export default function Missions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [completingMissionId, setCompletingMissionId] = useState<string | null>(null);
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMissions = async () => {
    try {
      const response = await fetch('/api/missions');
      if (!response.ok) throw new Error('Failed to fetch missions');
      const data = await response.json();
      setMissions(data);
    } catch (err) {
      setError('Could not load missions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();

    const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('new_mission', (mission: Mission) => {
      setMissions(prev => [mission, ...prev]);
    });

    newSocket.on('mission_updated', (updatedMission: Mission) => {
      setMissions(prev => prev.map(m => m._id === updatedMission._id ? updatedMission : m));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleClaim = async (missionId: string) => {
    const token = localStorage.getItem('pawnet_token');
    if (!token) return alert('Please login to claim a mission');

    try {
      const response = await fetch(`/api/missions/${missionId}/claim`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to claim');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleComplete = async (e: any) => {
    e.preventDefault();
    if (!completingMissionId) return;

    const token = localStorage.getItem('pawnet_token');
    if (!token) return alert('Please login to complete a mission');
    
    setIsSubmittingProof(true);

    try {
      const formData = new FormData();
      if (proofPhoto) {
        formData.append('photo', proofPhoto);
      }
      if (proofNotes) {
        formData.append('notes', proofNotes);
      }

      const response = await fetch(`/api/missions/${completingMissionId}/complete`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to complete');
      }
      setCompletingMissionId(null);
      setProofPhoto(null);
      setProofNotes('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const currentUserStr = localStorage.getItem('pawnet_user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Volunteer Missions</h1>
          <p className="text-gray-400">Claim a rescue mission to earn points and save lives.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading missions...</div>
      ) : error ? (
        <div className="text-center py-20 text-red-400">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {missions.map((mission) => (
              <motion.div
                key={mission._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-brand-dark rounded-xl border border-white/10 overflow-hidden hover:border-brand-primary/30 transition-colors"
              >
                {mission.cat?.photos?.[0] ? (
                  <div className="h-48 w-full relative">
                    <img src={mission.cat.photos[0]} alt="Mission Cat" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white capitalize">
                        {mission.type}
                      </span>
                      {mission.urgency === 'urgent' && (
                        <span className="flex items-center gap-1 text-red-400 font-bold text-xs bg-red-400/10 px-2 py-1 rounded-md">
                          <ShieldAlert className="w-3 h-3" /> URGENT
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-24 bg-white/5 flex items-center justify-between px-6">
                     <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-white capitalize">
                        {mission.type}
                      </span>
                      {mission.urgency === 'urgent' && (
                        <span className="flex items-center gap-1 text-red-400 font-bold text-xs">
                          <ShieldAlert className="w-4 h-4" /> URGENT
                        </span>
                      )}
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2">{mission.title}</h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{mission.description}</p>
                  
                  {mission.location?.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <MapPin className="w-4 h-4 text-brand-primary" />
                      <span className="truncate">{mission.location.address}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <div className="text-sm">
                      <span className="text-brand-accent font-bold">+{mission.pointsReward}</span>
                      <span className="text-gray-500 ml-1">pts</span>
                    </div>
                    
                    {mission.status === 'open' && (
                      <button 
                        onClick={() => handleClaim(mission._id)}
                        className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-brand-dark font-bold text-sm rounded-lg flex items-center gap-2 transition-all active:scale-95"
                      >
                        Claim Mission <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                    
                    {mission.status === 'claimed' && currentUser && mission.claimedBy?._id === currentUser._id && (
                      <button 
                        onClick={() => setCompletingMissionId(mission._id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white font-bold text-sm rounded-lg flex items-center gap-2 transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Submit Proof
                      </button>
                    )}

                    {mission.status === 'claimed' && (!currentUser || mission.claimedBy?._id !== currentUser._id) && (
                      <span className="text-sm text-gray-400 italic">Claimed by {mission.claimedBy?.name}</span>
                    )}

                    {mission.status === 'completed' && (
                      <span className="text-sm text-green-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Completed</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {missions.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No active missions at the moment. You're all caught up!
            </div>
          )}
        </div>
      )}

      {/* Proof of Rescue Modal */}
      <AnimatePresence>
        {completingMissionId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-dark border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl"
            >
              <button 
                onClick={() => setCompletingMissionId(null)}
                className="absolute right-4 top-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center mb-6 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-black text-white">Proof of Rescue</h2>
                <p className="text-gray-400 text-sm mt-2">
                  Upload a photo of the rescued cat at the vet or temporary shelter to verify completion and claim your points.
                </p>
              </div>

              <form onSubmit={handleComplete} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Upload Photo</label>
                  <div className="w-full h-32 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center hover:bg-white/5 hover:border-brand-primary transition-all cursor-pointer relative overflow-hidden">
                    {proofPhoto ? (
                      <img src={URL.createObjectURL(proofPhoto)} alt="Proof" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-gray-500 mb-2" />
                        <span className="text-sm font-semibold text-gray-400">Click to upload image</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      required
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setProofPhoto(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes (Optional)</label>
                  <textarea 
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                    placeholder="Any details about the vet visit or the cat's condition..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-primary/50 text-sm resize-none"
                    rows={3}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={!proofPhoto || isSubmittingProof}
                  className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                >
                  {isSubmittingProof ? 'Verifying...' : 'Verify & Complete Mission'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
