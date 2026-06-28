import React from 'react';
import { motion } from 'motion/react';
import { Eye, Camera, Bell, HeartPulse } from 'lucide-react';
import { Step } from '../types';
import { STEPS } from '../data';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Eye,
  Camera,
  Bell,
  HeartPulse,
};

export default function HowItWorks() {
  return (
    <section className="py-20 bg-brand-light dark:bg-brand-dark/40 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
          <h2 className="font-heading text-3xl font-extrabold text-brand-dark dark:text-brand-light tracking-tight">
            How It Works
          </h2>
          <p className="text-sm text-brand-muted dark:text-brand-light/70 leading-relaxed">
            Four simple steps to save a life and make an impact.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative">
          {/* Connecting Line (Dashed, hidden on mobile) */}
          <div className="absolute top-12 left-[12%] right-[12%] h-[2px] border-t-2 border-dashed border-brand-cream dark:border-brand-muted/25 z-0 hidden md:block" />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
            {STEPS.map((step: Step, idx) => {
              const Icon = ICON_MAP[step.iconName] || Eye;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  className="flex flex-col items-center text-center group"
                >
                  {/* Icon Wrapper */}
                  <div className="h-20 w-20 rounded-2xl bg-white dark:bg-brand-dark border border-brand-cream dark:border-brand-muted/20 flex items-center justify-center shadow-sm group-hover:border-brand-primary dark:group-hover:border-brand-primary group-hover:shadow-md transition-all duration-300 relative">
                    <Icon className="h-8 w-8 text-brand-primary group-hover:scale-110 transition-transform duration-300" />
                    {/* Step badge */}
                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-brand-primary/10 border border-brand-primary/25 text-[10px] font-bold text-brand-primary flex items-center justify-center">
                      {step.id}
                    </span>
                  </div>

                  {/* Text Content */}
                  <div className="mt-6 space-y-1.5 max-w-[220px]">
                    <h3 className="font-heading font-extrabold text-brand-dark dark:text-brand-light text-base">
                      {step.id}. {step.title}
                    </h3>
                    <p className="text-xs text-brand-muted dark:text-brand-light/60 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
