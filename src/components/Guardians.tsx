import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Flame, Star, X, Check } from 'lucide-react';
import { GUARDIANS } from '../data';
import { Guardian } from '../types';

export default function Guardians() {
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(null);

  // Mock achievement logs for guardians
  const mockAchievements: Record<string, { missions: number; rescueCount: number; favColony: string }> = {
    'guardian-1': { missions: 142, rescueCount: 48, favColony: 'Colony #42 (Industrial Area)' },
    'guardian-2': { missions: 218, rescueCount: 15, favColony: 'Colony #11 (Oak Park)' },
    'guardian-3': { missions: 89, rescueCount: 32, favColony: 'Colony #8 (Waterfront Cattery)' },
  };

  return (
    <section id="guardians" className="py-20 bg-brand-light dark:bg-brand-dark/40 border-t border-brand-cream dark:border-brand-muted/10">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block">Local Heroes</span>
          <h2 className="font-heading text-3xl font-extrabold text-brand-dark dark:text-brand-light tracking-tight">
            Our Top Guardians
          </h2>
          <p className="text-sm text-brand-muted dark:text-brand-light/70 leading-relaxed">
            The dedicated humans leading the change in our community.
          </p>
        </div>

        {/* Guardians Circle Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-6 justify-center">
          {GUARDIANS.map((guardian, idx) => (
            <motion.div
              key={guardian.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              onClick={() => setSelectedGuardian(guardian)}
              className="flex flex-col items-center text-center group cursor-pointer"
            >
              {/* Profile Avatar with badge */}
              <div className="relative">
                {/* Decorative gold ring for top guardian */}
                {idx === 0 && (
                  <span className="absolute -inset-1 rounded-full border-2 border-amber-500 animate-pulse" />
                )}

                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white dark:border-brand-dark shadow-lg group-hover:scale-102 group-hover:border-brand-primary transition-all duration-300 bg-brand-cream relative">
                  <img src={guardian.avatar} alt={guardian.name} className="w-full h-full object-cover" />
                </div>

                {/* EXP EXP floating badge at the bottom center of circle */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-brand-primary border-2 border-white dark:border-brand-dark px-3 py-0.5 shadow-md flex items-center gap-1">
                  <span className="text-[9px] font-extrabold text-white tracking-wider uppercase">
                    EXP {guardian.exp.replace(' XP', '')}
                  </span>
                </div>
              </div>

              {/* Text content details */}
              <div className="mt-6 space-y-1">
                <h3 className="font-heading font-extrabold text-brand-dark dark:text-brand-light text-base group-hover:text-brand-primary transition-colors">
                  {guardian.name}
                </h3>
                <p className="text-[10px] text-brand-primary font-extrabold uppercase tracking-widest">
                  {guardian.title}
                </p>
                <div className="flex items-center justify-center gap-1 text-xs text-brand-muted dark:text-brand-light/60 mt-2 font-medium">
                  <Flame className="h-4.5 w-4.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span>{guardian.streak} Day Streak</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detailed Guardian Inspector Drawer Overlay */}
        <AnimatePresence>
          {selectedGuardian && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedGuardian(null)}
                className="absolute inset-0 bg-brand-dark/30 backdrop-blur-sm"
              />

              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-brand-dark border border-brand-cream p-6 shadow-2xl space-y-6"
              >
                <button
                  onClick={() => setSelectedGuardian(null)}
                  className="absolute right-4 top-4 rounded-full p-1.5 text-brand-muted hover:bg-brand-cream hover:text-brand-dark"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col items-center text-center space-y-3 pt-4">
                  <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-brand-primary shadow-md bg-brand-cream">
                    <img src={selectedGuardian.avatar} alt={selectedGuardian.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-lg text-brand-dark dark:text-brand-light">
                      {selectedGuardian.name}
                    </h4>
                    <p className="text-[10px] text-brand-primary font-extrabold uppercase tracking-widest">
                      {selectedGuardian.title}
                    </p>
                    <span className="text-xs text-brand-muted dark:text-brand-light/60 font-semibold mt-1 block">
                      {selectedGuardian.level}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-y border-brand-cream dark:border-brand-muted/15 py-4 text-center">
                  <div>
                    <span className="text-[10px] text-brand-muted dark:text-brand-light/50 font-bold uppercase">Missions</span>
                    <p className="text-sm font-extrabold text-brand-dark dark:text-brand-light mt-0.5">
                      {mockAchievements[selectedGuardian.id]?.missions || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-muted dark:text-brand-light/50 font-bold uppercase">Streak</span>
                    <p className="text-sm font-extrabold text-brand-dark dark:text-brand-light mt-0.5 flex items-center justify-center gap-0.5 text-amber-500">
                      <Flame className="h-4 w-4 fill-current" /> {selectedGuardian.streak}d
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-muted dark:text-brand-light/50 font-bold uppercase">Rescued</span>
                    <p className="text-sm font-extrabold text-brand-dark dark:text-brand-light mt-0.5 text-brand-green">
                      {mockAchievements[selectedGuardian.id]?.rescueCount || 0} Cats
                    </p>
                  </div>
                </div>

                <div className="space-y-2 bg-brand-light dark:bg-brand-muted/5 rounded-xl p-3.5 text-xs text-brand-muted dark:text-brand-light/70">
                  <p className="font-semibold text-brand-dark dark:text-brand-light flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                    Specialized Focus Area
                  </p>
                  <p className="leading-relaxed">
                    Most frequently checks <strong>{mockAchievements[selectedGuardian.id]?.favColony}</strong>, assisting with TNR (Trap-Neuter-Return) and automated feeding runs.
                  </p>
                </div>

                <button
                  onClick={() => setSelectedGuardian(null)}
                  className="w-full rounded-xl bg-brand-dark py-2.5 font-semibold text-white hover:bg-brand-dark/95 text-xs transition-colors"
                >
                  Awesome!
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
