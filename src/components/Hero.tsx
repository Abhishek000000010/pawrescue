import { motion } from 'motion/react';
import { AlertTriangle, Heart, Shield, ChevronRight } from 'lucide-react';

interface HeroProps {
  onReportClick: () => void;
  onAdoptClick: () => void;
  onVolunteerClick: () => void;
}

export default function Hero({ onReportClick, onAdoptClick, onVolunteerClick }: HeroProps) {
  return (
    <section id="home" className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=2000"
          alt="Stray cats resting together in a cozy shelter"
          className="w-full h-full object-cover object-center scale-105 select-none"
        />
        {/* Gradients to fade image into backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-transparent dark:from-brand-dark/95 dark:via-brand-dark/80 dark:to-brand-dark/40" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-brand-light dark:from-brand-dark to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand-light/40 dark:from-brand-dark/40 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-2xl text-left space-y-6">
          {/* Tagline Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 border border-brand-primary/15 px-3 py-1 text-[10px] sm:text-xs font-bold tracking-widest text-brand-primary uppercase"
          >
            <Shield className="h-3 w-3 fill-brand-primary/10" />
            Building a compassionate world
          </motion.div>

          {/* Heading */}
          <div className="space-y-3">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold text-brand-dark dark:text-brand-light leading-[1.1] tracking-tight"
            >
              Every stray deserves <br />
              <span className="text-brand-primary relative inline-block">
                a safe home.
                <svg className="absolute -bottom-1.5 left-0 w-full h-2 text-brand-primary/25" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0,5 Q50,10 100,5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>
          </div>

          {/* Paragraph description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base sm:text-lg text-brand-muted dark:text-brand-light/80 leading-relaxed font-normal"
          >
            Join a global community of rescuers, volunteers, and foster homes dedicated to improving the lives of stray cats everywhere.
          </motion.p>

          {/* Quick Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-3 pt-4"
          >
            <button
              onClick={onReportClick}
              className="group rounded-xl bg-brand-primary px-6 py-3.5 font-bold text-white shadow-xl shadow-brand-primary/25 hover:bg-brand-primary-hover hover:scale-[1.02] hover:shadow-brand-primary/35 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <AlertTriangle className="h-4.5 w-4.5 text-white animate-pulse" />
              Report a Cat
              <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onAdoptClick}
              className="rounded-xl border-2 border-brand-dark dark:border-brand-light bg-transparent px-6 py-3 font-bold text-brand-dark dark:text-brand-light hover:bg-brand-dark hover:text-white dark:hover:bg-brand-light dark:hover:text-brand-dark active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
            >
              <Heart className="h-4.5 w-4.5" />
              Adopt a Cat
            </button>

            <button
              onClick={onVolunteerClick}
              className="rounded-xl bg-brand-blue-bg dark:bg-brand-muted/20 border border-transparent hover:border-brand-primary/10 px-6 py-3 font-bold text-brand-muted dark:text-brand-light/90 hover:text-brand-primary active:scale-95 transition-all text-center flex items-center justify-center"
            >
              Volunteer
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
