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
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-brand-primary/5 dark:bg-brand-primary/10 rounded-[100%] blur-[80px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-20 space-y-4">
          <span className="inline-block py-1 px-3 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-bold tracking-widest uppercase mb-2">The Process</span>
          <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            How It Works
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Four simple steps to save a life and make an impact in your local community.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-12 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent z-0 hidden md:block" />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 sm:gap-8 relative z-10">
            {STEPS.map((step: Step, idx) => {
              const Icon = ICON_MAP[step.iconName] || Eye;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: idx * 0.15, ease: "easeOut" }}
                  className="flex flex-col items-center text-center group"
                >
                  {/* Icon Wrapper */}
                  <div className="h-24 w-24 rounded-3xl glass flex items-center justify-center shadow-xl group-hover:-translate-y-2 group-hover:shadow-brand-primary/20 transition-all duration-500 relative">
                    <Icon className="h-10 w-10 text-brand-primary group-hover:scale-110 transition-transform duration-500" />
                    
                    {/* Step badge */}
                    <span className="absolute -bottom-3 right-[-10px] h-8 w-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-xs font-black text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900">
                      0{step.id}
                    </span>
                  </div>

                  {/* Text Content */}
                  <div className="mt-8 space-y-2 max-w-[240px]">
                    <h3 className="font-heading font-extrabold text-zinc-900 dark:text-white text-lg group-hover:text-brand-primary transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
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
