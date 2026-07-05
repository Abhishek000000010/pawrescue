import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, Clock, ShieldCheck, CheckCircle2, Heart, Award, ArrowRight } from 'lucide-react';
import { MISSIONS } from '../data';
import { Mission } from '../types';

interface UrgentMissionsProps {
  onExploreClick: () => void;
}

export default function UrgentMissions({ onExploreClick }: UrgentMissionsProps) {
  const [activeMissions, setActiveMissions] = useState<Mission[]>(MISSIONS);
  const [claimedList, setClaimedList] = useState<string[]>([]);
  const [points, setPoints] = useState(0);

  const handleAccept = (missionId: string) => {
    setClaimedList((prev) => [...prev, missionId]);
    setPoints((p) => p + 150);

    // Update locally
    setActiveMissions((prev) =>
      prev.map((m) =>
        m.id === missionId ? { ...m, status: 'claimed' } : m
      )
    );
  };

  return (
    <section id="missions" className="py-20 bg-brand-light dark:bg-brand-dark/40 border-t border-brand-cream dark:border-brand-muted/10 relative overflow-hidden">
      
      {/* Floating Sparkles or indicators */}
      {points > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-40 rounded-xl bg-brand-green text-white px-4 py-2.5 shadow-xl flex items-center gap-2 text-xs font-bold"
        >
          <Award className="h-4 w-4 text-amber-300 fill-amber-300" />
          <span>Claimed! +{points} XP gained</span>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block">Near You</span>
            <h2 className="font-heading text-3xl font-extrabold text-brand-dark dark:text-brand-light tracking-tight">
              Urgent Local Missions
            </h2>
          </div>
          <button
            onClick={onExploreClick}
            className="rounded-xl border border-brand-cream bg-white dark:bg-brand-dark dark:border-brand-muted/20 px-4 py-2 text-xs font-bold text-brand-dark dark:text-brand-light hover:bg-brand-cream hover:border-brand-primary dark:hover:bg-brand-muted/20 transition-all flex items-center gap-1.5"
          >
            Explore All Missions
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Missions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeMissions.map((mission) => {
            const isClaimed = claimedList.includes(mission.id);

            return (
              <motion.div
                key={mission.id}
                layout
                className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-brand-dark border transition-all ${
                  isClaimed
                    ? 'border-brand-green/30 ring-2 ring-brand-green/5 shadow-md'
                    : 'border-brand-cream dark:border-brand-muted/15 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Visual Image */}
                <div className="relative aspect-[16/10] w-full bg-brand-cream overflow-hidden">
                  <img
                    src={mission.image}
                    alt={mission.title}
                    className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  
                  {/* Category Badges */}
                  <div className="absolute top-4 left-4 flex gap-1.5 items-center">
                    {mission.urgent && (
                      <span className="rounded-md bg-brand-primary px-2 py-0.5 text-[9px] font-extrabold text-white uppercase tracking-wider shadow-sm animate-pulse">
                        Urgent
                      </span>
                    )}
                    {mission.isNew && (
                      <span className="rounded-md bg-brand-green px-2 py-0.5 text-[9px] font-extrabold text-white uppercase tracking-wider shadow-sm">
                        New
                      </span>
                    )}
                  </div>

                  {/* Distance badge bottom left */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-1 text-zinc-800 dark:text-white text-xs font-semibold">
                    <Navigation className="h-3.5 w-3.5 rotate-45 fill-white/10" />
                    <span>{mission.distance}</span>
                  </div>
                </div>

                {/* Content body */}
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-heading font-extrabold text-brand-dark dark:text-brand-light text-base group-hover:text-brand-primary transition-colors">
                      {mission.title}
                    </h3>
                    <p className="text-xs text-brand-muted dark:text-brand-light/65 leading-relaxed min-h-[50px]">
                      {mission.description}
                    </p>
                  </div>

                  {/* Accept Mission Action */}
                  <div className="border-t border-brand-cream/60 dark:border-brand-muted/15 pt-4">
                    <AnimatePresence mode="wait">
                      {isClaimed ? (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col gap-2"
                        >
                          <div className="flex items-center gap-1.5 text-brand-green text-xs font-bold bg-brand-green/5 rounded-xl px-3 py-2 border border-brand-green/15">
                            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-brand-green" />
                            <span>Mission Accepted! Directions sent to phone.</span>
                          </div>
                          <span className="text-[10px] text-brand-muted leading-tight block px-1">
                            Complete the tasks to gain +150 EXP and level up.
                          </span>
                        </motion.div>
                      ) : (
                        <button
                          onClick={() => handleAccept(mission.id)}
                          className="w-full rounded-xl bg-brand-primary/10 hover:bg-brand-primary hover:text-white px-4 py-2.5 text-xs font-bold text-brand-primary transition-all text-center block focus:outline-none"
                        >
                          Accept Mission
                        </button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
