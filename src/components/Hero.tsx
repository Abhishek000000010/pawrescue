import { motion } from 'motion/react';
import { AlertTriangle, Heart, Shield, ChevronRight, PawPrint, Sparkles } from 'lucide-react';

interface HeroProps {
  onReportClick: () => void;
  onAdoptClick: () => void;
  onVolunteerClick: () => void;
}

export default function Hero({ onReportClick, onAdoptClick, onVolunteerClick }: HeroProps) {
  return (
    <section id="home" className="relative min-h-[100vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
      {/* Dynamic Background Image & Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-brand-light dark:bg-brand-dark transition-colors duration-500" />
        
        {/* Animated Glow Orbs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-primary/20 dark:bg-brand-primary/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 left-[-20%] w-[600px] h-[600px] bg-brand-accent/20 dark:bg-brand-accent/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-lighten animate-pulse" style={{ animationDuration: '10s' }} />

        {/* The Hero Image (Banner Style) */}
        <div className="absolute inset-x-0 bottom-0 w-full pointer-events-none z-10 mix-blend-multiply dark:mix-blend-lighten">
            <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="w-full flex items-end"
            style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 15%, rgba(0,0,0,0.4) 35%, black 60%)', maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 15%, rgba(0,0,0,0.4) 35%, black 60%)' }}
          >
            <img
              src="/homepagecat.jpg"
              alt="Cat Banner"
              className="w-full h-auto opacity-95 brightness-[1.05] contrast-[1.05]"
            />
          </motion.div>
        </div>

        {/* Glassmorphism Floating Badge (Moved outside multiply layer) */}
        <div className="absolute inset-x-0 bottom-0 w-full h-[50vh] pointer-events-none z-20 overflow-hidden hidden md:block">
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute bottom-16 right-[10%] lg:right-[30%] z-30 glass px-6 py-4 rounded-3xl flex items-center gap-4 pointer-events-auto shadow-xl"
          >
            <div className="h-12 w-12 rounded-full bg-[#ED8A3E]/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-[#ED8A3E] fill-[#ED8A3E]" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">10,000+ Saves</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Join the movement</p>
            </div>
          </motion.div>
        </div>
        
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-brand-light dark:from-brand-dark to-transparent z-10" />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-2xl text-left space-y-8 -mt-12">
          {/* Heading */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-heading text-5xl sm:text-6xl md:text-7xl font-extrabold text-zinc-900 dark:text-white leading-[1.05] tracking-tight"
            >
              Every stray deserves <br />
              <span className="relative inline-block mt-2">
                <span className="relative z-10 text-brand-light">a safe home.</span>
                <span className="absolute inset-0 bg-brand-primary -rotate-2 rounded-xl scale-110 -z-10 shadow-lg shadow-brand-primary/25"></span>
              </span>
            </motion.h1>
          </div>

          {/* Paragraph description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl font-medium"
          >
            Join a global community of rescuers, volunteers, and foster homes dedicated to improving the lives of stray cats everywhere.
          </motion.p>

          {/* Quick Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 pt-6"
          >
            <button
              onClick={onReportClick}
              className="group relative overflow-hidden rounded-2xl bg-zinc-900 dark:bg-white px-8 py-4 font-bold text-white dark:text-zinc-900 shadow-xl shadow-zinc-900/20 dark:shadow-white/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <AlertTriangle className="h-5 w-5 relative z-10 group-hover:animate-bounce" />
              <span className="relative z-10">Report a Cat</span>
              <ChevronRight className="h-5 w-5 relative z-10 transform group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onAdoptClick}
              className="glass rounded-2xl px-8 py-4 font-bold text-zinc-900 dark:text-white hover:bg-white/50 dark:hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all text-center flex items-center justify-center gap-2"
            >
              <PawPrint className="h-5 w-5 text-brand-primary" />
              Adopt a Cat
            </button>
          </motion.div>
          
          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="pt-8 flex items-center gap-4"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <img key={i} className="w-10 h-10 rounded-full border-2 border-brand-light dark:border-brand-dark object-cover" src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
              ))}
            </div>
            <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              <span className="text-zinc-900 dark:text-white font-bold">2,500+</span> rescuers joined
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
