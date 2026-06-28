import { motion } from 'motion/react';

interface StatItem {
  number: string;
  label: string;
  colorClass: string;
}

const STATS_DATA: StatItem[] = [
  { number: '12,400+', label: 'Cats Rescued', colorClass: 'text-brand-primary' },
  { number: '3,500+', label: 'Active Volunteers', colorClass: 'text-brand-dark dark:text-brand-light' },
  { number: '8,200+', label: 'Cats Adopted', colorClass: 'text-brand-green' },
  { number: '15,000+', label: 'Missions Finished', colorClass: 'text-brand-primary' },
];

export default function Stats() {
  return (
    <section className="relative z-10 py-12 bg-white dark:bg-brand-dark border-y border-brand-cream dark:border-brand-muted/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-brand-cream/60 dark:divide-brand-muted/10">
          {STATS_DATA.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col items-center text-center p-4 first:pt-0 md:first:pt-4 last:pb-0 md:last:pb-4"
            >
              <span className={`font-heading text-3xl sm:text-4xl font-extrabold tracking-tight ${item.colorClass}`}>
                {item.number}
              </span>
              <span className="text-xs font-bold text-brand-muted dark:text-brand-light/60 uppercase tracking-widest mt-2">
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
