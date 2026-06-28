import { motion } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';

interface CTAProps {
  onJoinClick: () => void;
  onHelpClick: () => void;
}

export default function CTA({ onJoinClick, onHelpClick }: CTAProps) {
  return (
    <section className="py-16 bg-white dark:bg-brand-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Curvaceous CTA Card container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-[2.5rem] bg-brand-cream dark:bg-brand-muted/15 border border-slate-200/80 dark:border-brand-muted/10 p-8 sm:p-16 text-center space-y-6 overflow-hidden shadow-sm"
        >
          {/* Subtle warm ambient circles */}
          <div className="absolute -top-12 -left-12 h-48 w-48 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            {/* Sparkles Floating Icon */}
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-brand-dark text-brand-primary shadow-sm">
              <Sparkles className="h-5 w-5 fill-brand-primary/5" />
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-dark dark:text-brand-light leading-tight tracking-tight">
              Be the reason a stray survives <br />
              <span className="text-brand-primary">another day.</span>
            </h2>

            <p className="text-sm sm:text-base text-brand-muted dark:text-brand-light/75 leading-relaxed max-w-lg mx-auto">
              Every contribution, big or small, helps us provide food, medical care, and warm homes for cats in need.
            </p>
          </div>

          {/* Large Action triggers */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 relative z-10">
            <button
              onClick={onJoinClick}
              className="rounded-xl bg-brand-primary hover:bg-brand-primary-hover px-7 py-3.5 font-bold text-white shadow-xl transition-all hover:scale-[1.01] active:scale-95 text-sm flex items-center justify-center gap-1.5"
            >
              <Heart className="h-4.5 w-4.5 fill-white/10" />
              Join the Community
            </button>
            
            <button
              onClick={onHelpClick}
              className="rounded-xl border border-brand-dark/25 dark:border-brand-light/20 hover:border-brand-primary bg-white/70 dark:bg-transparent px-7 py-3.5 font-bold text-brand-dark dark:text-brand-light hover:bg-white dark:hover:bg-brand-light/10 transition-all text-sm"
            >
              Start Helping
            </button>
          </div>

          <div className="text-[10px] text-brand-muted font-semibold tracking-wider uppercase pt-4 relative z-10">
            Already 3,500+ Guardians strong • Since 2024
          </div>
        </motion.div>
        
      </div>
    </section>
  );
}
