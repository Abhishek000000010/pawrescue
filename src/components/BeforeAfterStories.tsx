import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, ChevronLeft, ChevronRight, CheckCircle2, MapPin } from 'lucide-react';
import { TESTIMONIALS } from '../data';

export default function BeforeAfterStories() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0-100
  const isDragging = useRef(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const story = TESTIMONIALS[currentIndex];

  const handleMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  const handleStartDragging = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
  };

  const handleNextStory = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    setSliderPosition(50);
  };

  const handlePrevStory = () => {
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
    setSliderPosition(50);
  };

  return (
    <section className="py-24 bg-white dark:bg-brand-dark">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Interactive Before/After Browser Mock Slider (5/12 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="text-left space-y-1.5 mb-2">
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block">The Journey of a Rescued Stray</span>
              <h3 className="font-heading text-xl font-extrabold text-brand-dark dark:text-brand-light">
                Drag Slider to Reveal Transition
              </h3>
            </div>

            {/* Browser Window Mock */}
            <div className="rounded-2xl border border-brand-cream dark:border-brand-muted/20 bg-brand-light dark:bg-brand-dark overflow-hidden shadow-xl">
              {/* Browser Header Bar */}
              <div className="bg-brand-cream/60 dark:bg-brand-muted/10 px-4 py-3 flex items-center justify-between border-b border-brand-cream dark:border-brand-muted/15">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="rounded-md bg-white dark:bg-brand-dark border border-brand-cream/80 dark:border-brand-muted/20 px-3 py-0.5 text-[10px] text-brand-muted font-mono w-48 text-center truncate">
                  pawrescue.org/stories/{story.catName.toLowerCase()}
                </div>
                <div className="w-10" />
              </div>

              {/* Slider Canvas Area */}
              <div
                ref={sliderRef}
                className="relative aspect-video w-full overflow-hidden select-none cursor-ew-resize bg-brand-cream"
                onMouseDown={handleStartDragging}
                onTouchStart={handleStartDragging}
              >
                {/* AFTER IMAGE (The Background) */}
                <img
                  src={story.afterImage}
                  alt={`${story.catName} after rescue`}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
                {/* AFTER Label Badge */}
                <div className="absolute right-4 bottom-4 z-10 rounded bg-brand-green/95 px-2.5 py-1 text-[9px] font-extrabold text-white uppercase tracking-wider">
                  After: Home & Health
                </div>

                {/* BEFORE IMAGE (The sliding foreground layer) */}
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={story.beforeImage}
                    alt={`${story.catName} before rescue`}
                    className="absolute inset-y-0 left-0 w-full h-full object-cover max-w-none pointer-events-none"
                    style={{ width: sliderRef.current?.getBoundingClientRect().width || 600 }}
                  />
                  {/* BEFORE Label Badge */}
                  <div className="absolute left-4 bottom-4 z-10 rounded bg-brand-primary/95 px-2.5 py-1 text-[9px] font-extrabold text-white uppercase tracking-wider">
                    Before: Life on the streets
                  </div>
                </div>

                {/* Vertical Dividing Handle Line */}
                <div
                  className="absolute inset-y-0 w-1 bg-white hover:bg-brand-primary cursor-ew-resize flex items-center justify-center z-20 shadow-md"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="h-8 w-8 rounded-full bg-brand-primary border-4 border-white text-white flex items-center justify-center shadow-lg pointer-events-none transform -translate-x-1/2">
                    <span className="text-[10px] font-extrabold">↔</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Location Badge */}
            <div className="flex justify-between text-xs text-brand-muted dark:text-brand-light/60 px-1">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {story.location}
              </span>
              <span>Slide to inspect details</span>
            </div>
          </div>

          {/* Right Column: Quotes & Author Success Details (7/12 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
              <Quote className="h-6 w-6 fill-brand-primary/5" />
            </div>

            {/* Testimonial Quote Panel */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  <h4 className="font-heading text-2xl sm:text-3xl font-extrabold text-brand-dark dark:text-brand-light leading-tight italic">
                    {story.quote}
                  </h4>
                  <p className="text-sm text-brand-muted dark:text-brand-light/75 leading-relaxed">
                    {story.details}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Avatar & Navigation section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-t border-brand-cream dark:border-brand-muted/20 pt-6">
              {/* Profile card */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full overflow-hidden border border-brand-cream bg-brand-light">
                  <img src={story.afterImage} alt={story.author} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h5 className="font-heading font-bold text-sm text-brand-dark dark:text-brand-light flex items-center gap-1.5">
                    {story.author}
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-brand-green bg-brand-green/10 px-1.5 py-0.5 rounded-full">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Verified Adopter
                    </span>
                  </h5>
                  <p className="text-[10px] text-brand-muted uppercase tracking-widest font-semibold mt-0.5">
                    Adopter of {story.catName}
                  </p>
                </div>
              </div>

              {/* Slider switch buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handlePrevStory}
                  className="h-10 w-10 rounded-xl border border-brand-cream dark:border-brand-muted/30 flex items-center justify-center text-brand-dark dark:text-brand-light hover:bg-brand-cream dark:hover:bg-brand-muted/20 hover:text-brand-primary active:scale-95 transition-all"
                  aria-label="Previous Success Story"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNextStory}
                  className="h-10 w-10 rounded-xl border border-brand-cream dark:border-brand-muted/30 flex items-center justify-center text-brand-dark dark:text-brand-light hover:bg-brand-cream dark:hover:bg-brand-muted/20 hover:text-brand-primary active:scale-95 transition-all"
                  aria-label="Next Success Story"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
