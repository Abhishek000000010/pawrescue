import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Heart, Shield, Award, Users, MapPin, Sparkles } from 'lucide-react';

interface VolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VolunteerModal({ isOpen, onClose }: VolunteerModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [hours, setHours] = useState('2-5');

  const toggleRole = (role: string) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || roles.length === 0) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setRoles([]);
    setName('');
    setEmail('');
    setLocation('');
    setHours('2-5');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleReset}
            className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-cream bg-brand-light px-6 py-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-brand-dark flex items-center gap-1.5">
                  Become a Guardian <Shield className="h-4 w-4 text-brand-primary" />
                </h3>
                <p className="text-xs text-brand-muted">Join 3,500+ active stray advocates worldwide</p>
              </div>
              <button
                onClick={handleReset}
                className="rounded-full p-1.5 text-brand-muted hover:bg-brand-cream hover:text-brand-dark transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-brand-dark">How would you like to help?</p>
                    <p className="text-xs text-brand-muted mt-0.5">Select all roles that interest you (Minimum 1)</p>
                  </div>

                  {/* Role Selector Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'feeding', label: 'Colony Feeder', desc: 'Refill dry food & water' },
                      { id: 'scout', label: 'Urban Scout', desc: 'Spot and report strays' },
                      { id: 'transport', label: 'Vet Transporter', desc: 'Drive cats to clinics' },
                      { id: 'foster', label: 'Emergency Foster', desc: 'Provide temporary shelter' },
                    ].map((role) => {
                      const isSelected = roles.includes(role.id);
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => toggleRole(role.id)}
                          className={`rounded-xl p-3.5 text-left border transition-all flex flex-col justify-between h-24 ${
                            isSelected
                              ? 'border-brand-primary bg-brand-primary/5 text-brand-primary ring-2 ring-brand-primary/10'
                              : 'border-brand-cream bg-brand-light/40 hover:border-brand-muted hover:bg-white text-brand-muted'
                          }`}
                        >
                          <span className={`text-xs font-bold ${isSelected ? 'text-brand-primary' : 'text-brand-dark'}`}>
                            {role.label}
                          </span>
                          <span className="text-[10px] mt-1.5 leading-tight block">
                            {role.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-brand-dark mb-1">Your Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-brand-cream bg-brand-light px-4 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-brand-dark mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="john@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border border-brand-cream bg-brand-light px-4 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brand-dark mb-1">Your Neighborhood</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-brand-muted" />
                          <input
                            type="text"
                            required
                            placeholder="Brooklyn, NY"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full rounded-xl border border-brand-cream bg-brand-light pl-9 pr-4 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-dark mb-1">Weekly availability (Hours)</label>
                      <select
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="w-full rounded-xl border border-brand-cream bg-brand-light px-4 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none"
                      >
                        <option value="1-2">1 - 2 hours / week</option>
                        <option value="2-5">2 - 5 hours / week</option>
                        <option value="5-10">5 - 10 hours / week</option>
                        <option value="10+">10+ hours / week</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={roles.length === 0}
                    className={`w-full rounded-xl py-3 font-semibold text-white shadow-lg transition-all ${
                      roles.length > 0
                        ? 'bg-brand-primary hover:bg-brand-primary-hover shadow-brand-primary/20'
                        : 'bg-gray-300 shadow-none cursor-not-allowed'
                    }`}
                  >
                    Submit Application
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                    <Heart className="h-10 w-10 fill-brand-primary" />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-heading text-xl font-bold text-brand-dark flex items-center justify-center gap-1.5">
                      Welcome to the League! <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
                    </h4>
                    <p className="text-sm text-brand-muted max-w-sm mx-auto">
                      Thank you for stepping up, <strong>{name}</strong>! Your application has been processed, and you have been initialized into the database.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-brand-cream bg-brand-light p-3 text-center">
                      <Award className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                      <span className="text-[10px] text-brand-muted block font-semibold uppercase">Starter Title</span>
                      <span className="text-xs font-bold text-brand-dark mt-0.5 block">Novice Advocate</span>
                    </div>
                    <div className="rounded-xl border border-brand-cream bg-brand-light p-3 text-center">
                      <Users className="h-5 w-5 text-brand-green mx-auto mb-1" />
                      <span className="text-[10px] text-brand-muted block font-semibold uppercase">Local Network</span>
                      <span className="text-xs font-bold text-brand-dark mt-0.5 block">{location || 'Nearby'} Division</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-brand-cream/50 p-4 text-left space-y-1 text-xs text-brand-muted">
                    <p className="font-semibold text-brand-dark">Next Steps:</p>
                    <p>1. Check your inbox ({email}) for a local onboarding guide.</p>
                    <p>2. Open the <strong className="text-brand-dark">Rescue Map</strong> to inspect active missions near you.</p>
                    <p>3. Attend our community meet-up scheduled for this Sunday at 10 AM.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full rounded-xl bg-brand-dark py-3 font-semibold text-white hover:bg-brand-dark/95 transition-colors"
                  >
                    Start Helping
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
