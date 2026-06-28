import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, ChevronRight, Eye, Shield, Users, Activity, CheckCircle2, Navigation } from 'lucide-react';

interface FeatureBentoProps {
  onMapClick: () => void;
  onAdoptClick: () => void;
  onVolunteerClick: () => void;
}

const MOCK_TRACKING: Record<string, { name: string; status: string; step: number; update: string; location: string }> = {
  'CAT-101': { name: 'Mochi', status: 'In Foster Care', step: 3, update: 'Recovering well from vaccinations. Socialization in progress.', location: 'Eastside Foster Home' },
  'CAT-402': { name: 'Oscar', status: 'Adopted!', step: 4, update: 'Happy, healthy, and officially adopted by Sarah M.!', location: 'Brooklyn, NY' },
  'CAT-889': { name: 'Unnamed Calico', status: 'Scouted & Checking', step: 2, update: 'Scout Emma W. is checking the colony grounds.', location: 'Downtown Alleyway' },
};

export default function FeatureBento({ onMapClick, onAdoptClick, onVolunteerClick }: FeatureBentoProps) {
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState<typeof MOCK_TRACKING[string] | null>(null);
  const [trackError, setTrackError] = useState(false);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = trackId.toUpperCase().trim();
    if (MOCK_TRACKING[id]) {
      setTrackResult(MOCK_TRACKING[id]);
      setTrackError(false);
    } else {
      setTrackResult(null);
      setTrackError(true);
    }
  };

  return (
    <section className="py-20 bg-white dark:bg-brand-dark">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Real-time Rescue Map (66% Width on Large Screens) */}
          <div
            onClick={onMapClick}
            className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-brand-light dark:bg-brand-muted/10 border border-brand-cream dark:border-brand-muted/20 p-8 flex flex-col justify-between h-[360px] cursor-pointer hover:shadow-xl hover:border-brand-primary/20 dark:hover:border-brand-primary/30 transition-all duration-300"
          >
            {/* Map Graphic Preview Background */}
            <div className="absolute top-1/2 -translate-y-1/2 right-12 w-80 h-80 rounded-full border border-brand-primary/10 bg-brand-cream/40 dark:bg-brand-muted/5 flex items-center justify-center pointer-events-none group-hover:scale-105 transition-transform duration-500">
              <div className="w-56 h-56 rounded-full border border-brand-primary/15 bg-white dark:bg-brand-dark flex items-center justify-center animate-pulse">
                <div className="w-24 h-24 rounded-full border border-brand-primary/20 bg-brand-cream dark:bg-brand-muted/20 flex items-center justify-center">
                  <MapPin className="h-10 w-10 text-brand-primary fill-brand-primary/10" />
                </div>
              </div>
              <span className="absolute top-1/4 left-1/4 h-2 w-2 rounded-full bg-brand-green" />
              <span className="absolute bottom-1/4 right-1/4 h-2 w-2 rounded-full bg-brand-primary" />
            </div>

            <div className="space-y-4 max-w-sm relative z-10">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-brand-dark shadow-sm border border-brand-cream dark:border-brand-muted/20 text-brand-primary">
                <Navigation className="h-6 w-6 rotate-45 fill-brand-primary/5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading text-2xl font-bold text-brand-dark dark:text-brand-light">
                  Real-time Rescue Map
                </h3>
                <p className="text-xs sm:text-sm text-brand-muted dark:text-brand-light/70 leading-relaxed">
                  Coordinate with local rescuers in real-time. View active missions, feeding stations, and reported colonies in your city.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-brand-primary flex items-center gap-1 group-hover:gap-2 transition-all relative z-10">
              Explore the Map <ChevronRight className="h-4 w-4" />
            </span>
          </div>

          {/* Card 2: Find a Friend (33% Width) */}
          <div
            onClick={onAdoptClick}
            className="group relative overflow-hidden rounded-3xl bg-brand-cream/40 dark:bg-brand-muted/5 border border-brand-cream dark:border-brand-muted/20 p-8 flex flex-col justify-between h-[360px] cursor-pointer hover:shadow-xl hover:border-brand-primary/20 dark:hover:border-brand-primary/30 transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-brand-dark shadow-sm border border-brand-cream dark:border-brand-muted/20 text-brand-primary">
                <span className="font-heading font-extrabold text-base">🐾</span>
              </div>
              <div className="space-y-2">
                <h3 className="font-heading text-xl font-bold text-brand-dark dark:text-brand-light">
                  Find a Friend
                </h3>
                <p className="text-xs text-brand-muted dark:text-brand-light/70 leading-relaxed">
                  Browse our gallery of rescued cats waiting for their forever homes. Get paired with your perfect companion.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-brand-primary flex items-center gap-1 group-hover:gap-2 transition-all">
              Browse Gallery <ChevronRight className="h-4 w-4" />
            </span>
          </div>

          {/* Secondary cards row */}
          {/* Card 3: Missions */}
          <div
            onClick={onMapClick}
            className="group rounded-2xl bg-white dark:bg-brand-dark border border-brand-cream dark:border-brand-muted/15 p-6 flex flex-col justify-between h-[200px] cursor-pointer hover:border-brand-primary/20 hover:shadow-md transition-all"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-brand-light dark:bg-brand-muted/25 flex items-center justify-center text-brand-primary border border-brand-cream dark:border-brand-muted/20">
                <Shield className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-brand-dark dark:text-brand-light text-sm">Missions</h4>
                <p className="text-xs text-brand-muted dark:text-brand-light/65 leading-relaxed">
                  Join daily tasks like feeding, colony surveys, or medical transport in your area.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-brand-primary group-hover:underline flex items-center gap-0.5">
              Active tasks
            </span>
          </div>

          {/* Card 4: Foster Care */}
          <div
            onClick={onVolunteerClick}
            className="group rounded-2xl bg-white dark:bg-brand-dark border border-brand-cream dark:border-brand-muted/15 p-6 flex flex-col justify-between h-[200px] cursor-pointer hover:border-brand-primary/20 hover:shadow-md transition-all"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-brand-light dark:bg-brand-muted/25 flex items-center justify-center text-brand-green border border-brand-cream dark:border-brand-muted/20">
                <Users className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-brand-dark dark:text-brand-light text-sm">Foster Care</h4>
                <p className="text-xs text-brand-muted dark:text-brand-light/65 leading-relaxed">
                  Provide a temporary safe haven for recovering rescues while forever homes are being prepared.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-brand-green group-hover:underline">
              Become a Foster
            </span>
          </div>

          {/* Card 5: Track Progress (Interactive mini portal!) */}
          <div className="rounded-2xl bg-white dark:bg-brand-dark border border-brand-cream dark:border-brand-muted/15 p-6 flex flex-col justify-between h-[200px] hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-brand-light dark:bg-brand-muted/25 flex items-center justify-center text-brand-primary border border-brand-cream dark:border-brand-muted/20">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="text-[9px] font-bold text-brand-muted bg-brand-cream dark:bg-brand-muted/10 px-2 py-0.5 rounded-full">
                  TRACKER
                </span>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-brand-dark dark:text-brand-light text-sm">Track Progress</h4>
                <p className="text-xs text-brand-muted dark:text-brand-light/65 leading-relaxed">
                  Stay updated on the status of cats you have helped report.
                </p>
              </div>
            </div>

            {/* Micro Portal Search form */}
            <form onSubmit={handleTrackSubmit} className="relative mt-2">
              <input
                type="text"
                placeholder="Enter Case ID: e.g., CAT-402"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                className="w-full rounded-xl border border-brand-cream dark:border-brand-muted/25 bg-brand-light dark:bg-brand-dark pl-3 pr-10 py-1.5 text-xs text-brand-dark dark:text-brand-light placeholder-brand-muted focus:border-brand-primary focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-2.5 rounded-lg bg-brand-primary text-white text-[10px] font-bold hover:bg-brand-primary-hover transition-colors"
              >
                Track
              </button>
            </form>

            {/* Tracking Results Modal/Overlay inside bento block */}
            <AnimatePresence>
              {trackResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 bg-white dark:bg-brand-dark rounded-2xl border border-brand-primary/20 p-5 flex flex-col justify-between z-10 shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-brand-cream/60 dark:border-brand-muted/10 pb-1.5">
                      <span className="text-[10px] font-bold text-brand-primary uppercase">Case Found</span>
                      <button onClick={() => { setTrackResult(null); setTrackId(''); }} className="text-brand-muted hover:text-brand-dark">
                        ✕
                      </button>
                    </div>
                    <div>
                      <h5 className="font-heading font-bold text-xs text-brand-dark dark:text-brand-light flex items-center gap-1">
                        😺 {trackResult.name} <span className="text-[10px] text-brand-muted font-normal">({trackResult.location})</span>
                      </h5>
                      <p className="text-[10px] text-brand-muted dark:text-brand-light/70 leading-relaxed mt-1">
                        {trackResult.update}
                      </p>
                    </div>
                  </div>

                  {/* Tiny progress dots */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-brand-cream/60 dark:border-brand-muted/10">
                    {[1, 2, 3, 4].map((dot) => (
                      <div
                        key={dot}
                        className={`h-1.5 flex-1 rounded-full ${
                          dot <= trackResult.step
                            ? 'bg-brand-green'
                            : 'bg-gray-200 dark:bg-brand-muted/20'
                        }`}
                      />
                    ))}
                    <span className="text-[9px] font-bold text-brand-green ml-1">{trackResult.status}</span>
                  </div>
                </motion.div>
              )}

              {trackError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 bg-white dark:bg-brand-dark rounded-2xl border border-red-200 p-5 flex flex-col justify-between z-10 shadow-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between border-b border-brand-cream/60 dark:border-brand-muted/10 pb-1.5">
                      <span className="text-[10px] font-bold text-red-500 uppercase">Track Failed</span>
                      <button onClick={() => setTrackError(false)} className="text-brand-muted hover:text-brand-dark">
                        ✕
                      </button>
                    </div>
                    <p className="text-[10px] text-brand-muted leading-relaxed pt-2">
                      No case with ID <strong>{trackId}</strong> was found. Try searching <strong>CAT-402</strong> or <strong>CAT-101</strong> for simulation.
                    </p>
                  </div>
                  <button
                    onClick={() => { setTrackError(false); setTrackId(''); }}
                    className="w-full rounded-lg bg-brand-light border border-brand-cream py-1 text-[10px] font-bold text-brand-dark"
                  >
                    Reset
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}
