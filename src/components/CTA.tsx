import { motion } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';

interface CTAProps {
  onJoinClick: () => void;
  onHelpClick: () => void;
}

export default function CTA({ onJoinClick, onHelpClick }: CTAProps) {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Curvaceous CTA Card container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative rounded-[3rem] glass p-10 sm:p-20 text-center space-y-8 overflow-hidden shadow-2xl"
        >
          {/* Subtle warm ambient circles */}
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-brand-primary/20 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-brand-accent/20 blur-[100px] pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            {/* Sparkles Floating Icon */}
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-brand-primary shadow-lg"
            >
              <Sparkles className="h-6 w-6 fill-brand-primary/20" />
            </motion.div>

            <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold text-zinc-900 dark:text-white leading-tight tracking-tight">
              Be the reason a stray survives <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">another day.</span>
            </h2>

            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg mx-auto font-medium">
              Every contribution, big or small, helps us provide food, medical care, and warm homes for cats in need.
            </p>
          </div>

          {/* Large Action triggers */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 relative z-10">
            <button
              onClick={onJoinClick}
              className="rounded-2xl bg-gradient-to-r from-brand-primary to-brand-accent px-8 py-4 font-bold text-white shadow-xl shadow-brand-primary/20 transition-all hover:scale-[1.02] active:scale-95 text-base flex items-center justify-center gap-2 group"
            >
              <Heart className="h-5 w-5 fill-white/20 group-hover:scale-110 transition-transform" />
              Join the Community
            </button>
            
            <button
              onClick={onHelpClick}
              className="glass rounded-2xl px-8 py-4 font-bold text-zinc-900 dark:text-white hover:bg-white/50 dark:hover:bg-white/10 transition-all text-base hover:scale-[1.02] active:scale-95"
            >
              Start Helping
            </button>
          </div>
        </motion.div>
        
      </div>
    </section>
  );
}
