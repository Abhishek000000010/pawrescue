import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Shield, Award, Users, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';

interface VolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Read the logged-in user saved at login/register time.
const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('pawnet_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function VolunteerModal({ isOpen, onClose }: VolunteerModalProps) {
  const storedUser = getStoredUser();
  const alreadyGuardian = storedUser?.role === 'volunteer';

  const [submitted, setSubmitted] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState('2-5');
  const [conduct, setConduct] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Foster location (only relevant when the "foster" role is selected)
  const [fosterCoords, setFosterCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showOnMap, setShowOnMap] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  const isFoster = roles.includes('foster');

  // Load the user's existing Guardian profile so they can EDIT it (add roles,
  // add a foster location later) instead of being locked into a dead-end screen.
  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem('pawnet_token');
    if (!token) return;
    let active = true;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (!active || !p) return;
        if (Array.isArray(p.volunteerRoles)) setRoles(p.volunteerRoles);
        if (p.availability) setHours(p.availability);
        if (p.codeOfConductAccepted) setConduct(true);
        if (p.location?.city) setLocation(p.location.city);
        if (p.phone) setPhone(p.phone);
        if (p.showOnMap) setShowOnMap(true);
        const c = p.location?.coordinates;
        if (typeof c?.lat === 'number' && typeof c?.lng === 'number') {
          setFosterCoords({ lat: c.lat, lng: c.lng });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen]);

  const handleUseLocation = () => {
    setLocError('');
    if (!navigator.geolocation) {
      setLocError('Location is not available in this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFosterCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError('Could not get your location. Please allow location access.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const name = storedUser?.name || '';
  const email = storedUser?.email || '';

  const toggleRole = (role: string) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (roles.length === 0) {
      setError('Please pick at least one way you would like to help.');
      return;
    }
    if (!conduct) {
      setError('Please agree to the Guardian Code of Conduct to continue.');
      return;
    }
    if (isFoster && showOnMap && !fosterCoords) {
      setError('Please share your location to appear on the foster map, or turn that option off.');
      return;
    }

    const token = localStorage.getItem('pawnet_token');
    if (!token) {
      setError('Please log in again to continue.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/volunteer', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roles,
          city: location,
          availability: hours,
          phone,
          codeOfConductAccepted: conduct,
          lat: fosterCoords?.lat,
          lng: fosterCoords?.lng,
          showOnMap: isFoster && showOnMap,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.');
        return;
      }

      // Reflect the new Guardian role locally so the UI updates immediately.
      if (storedUser) {
        localStorage.setItem(
          'pawnet_user',
          JSON.stringify({ ...storedUser, role: data.role || 'volunteer' })
        );
      }
      setSubmitted(true);
    } catch (err: any) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setRoles([]);
    setLocation('');
    setPhone('');
    setHours('2-5');
    setConduct(false);
    setError('');
    setFosterCoords(null);
    setShowOnMap(false);
    setLocating(false);
    setLocError('');
    onClose();
  };

  const showSuccess = submitted;

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
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-cream bg-brand-light px-6 py-4 sticky top-0 z-10">
              <div>
                <h3 className="font-heading text-lg font-bold text-brand-dark flex items-center gap-1.5">
                  {alreadyGuardian ? 'Update Guardian profile' : 'Become a Guardian'} <Shield className="h-4 w-4 text-brand-primary" />
                </h3>
                <p className="text-xs text-brand-muted">
                  {alreadyGuardian
                    ? 'Add roles or a foster location, then save your changes.'
                    : 'Open onboarding — no waiting, no approval queue.'}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="rounded-full p-1.5 text-brand-muted hover:bg-brand-cream hover:text-brand-dark transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {!showSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Logged-in identity (from account) */}
                  <div className="rounded-xl border border-brand-cream bg-brand-light/60 px-4 py-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                      {name ? name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-brand-dark truncate">{name || 'Your account'}</p>
                      <p className="text-xs text-brand-muted truncate">{email}</p>
                    </div>
                  </div>

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

                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">Your Neighborhood</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-brand-muted" />
                      <input
                        type="text"
                        required
                        placeholder="Pune, MH"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full rounded-xl border border-brand-cream bg-brand-light pl-9 pr-4 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Phone (for coordination) */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">Phone (for coordination)</label>
                    <input
                      type="tel"
                      placeholder="+91 90000 00000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-brand-cream bg-brand-light px-4 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none"
                    />
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

                  {/* Foster location — only when the foster role is selected */}
                  {isFoster && (
                    <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-3.5 space-y-2.5">
                      <p className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-teal-600" /> Foster location
                      </p>
                      <button
                        type="button"
                        onClick={handleUseLocation}
                        disabled={locating}
                        className={`w-full rounded-lg border px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${
                          fosterCoords
                            ? 'border-brand-green/40 bg-brand-green/10 text-brand-green'
                            : 'border-teal-500/40 text-teal-700 hover:bg-teal-500/10'
                        }`}
                      >
                        {locating
                          ? 'Getting your location…'
                          : fosterCoords
                          ? '✓ Location captured'
                          : 'Use my current location'}
                      </button>

                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showOnMap}
                          onChange={(e) => setShowOnMap(e.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-teal-600"
                        />
                        <span className="text-[11px] text-brand-muted leading-relaxed">
                          Show my <strong className="text-brand-dark">approximate</strong> area on the public rescue map so
                          nearby rescuers can find a foster. Your exact address is never shared — the pin is snapped to a
                          ~100&nbsp;m area.
                        </span>
                      </label>

                      {locError && <p className="text-[11px] font-medium text-red-500">{locError}</p>}
                    </div>
                  )}

                  {/* Code of Conduct — the real gate */}
                  <label className="flex items-start gap-3 rounded-xl border border-brand-cream bg-brand-cream/40 p-3.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={conduct}
                      onChange={(e) => setConduct(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-brand-primary"
                    />
                    <span className="text-xs text-brand-muted leading-relaxed">
                      I agree to the <strong className="text-brand-dark">Guardian Code of Conduct</strong> — I will treat
                      animals humanely, act safely and lawfully, respect other volunteers, and only handle rescues within
                      my ability.
                    </span>
                  </label>

                  {error && (
                    <p className="text-xs font-medium text-red-500 text-center">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || roles.length === 0 || !conduct}
                    className={`w-full rounded-xl py-3 font-semibold text-white shadow-lg transition-all ${
                      !loading && roles.length > 0 && conduct
                        ? 'bg-brand-primary hover:bg-brand-primary-hover shadow-brand-primary/20'
                        : 'bg-gray-300 shadow-none cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Saving…' : alreadyGuardian ? 'Save changes' : 'Become a Guardian'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                    <Heart className="h-10 w-10 fill-brand-primary" />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-heading text-xl font-bold text-brand-dark flex items-center justify-center gap-1.5">
                      {alreadyGuardian ? 'Guardian profile updated!' : "You're a Guardian now!"}{' '}
                      <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
                    </h4>
                    <p className="text-sm text-brand-muted max-w-sm mx-auto">
                      {alreadyGuardian ? (
                        <>Nice one, <strong>{name}</strong>! Your updated roles{isFoster && showOnMap ? ' and foster location are' : ' are'} saved to your account.</>
                      ) : (
                        <>Thank you for stepping up, <strong>{name}</strong>! Your Guardian profile is live and saved to your account.</>
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-brand-cream bg-brand-light p-3 text-center">
                      <Award className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                      <span className="text-[10px] text-brand-muted block font-semibold uppercase">Status</span>
                      <span className="text-xs font-bold text-brand-dark mt-0.5 block">Active Guardian</span>
                    </div>
                    <div className="rounded-xl border border-brand-cream bg-brand-light p-3 text-center">
                      <CheckCircle2 className="h-5 w-5 text-brand-green mx-auto mb-1" />
                      <span className="text-[10px] text-brand-muted block font-semibold uppercase">Code of Conduct</span>
                      <span className="text-xs font-bold text-brand-dark mt-0.5 block">Accepted</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-brand-cream/50 p-4 text-left space-y-1 text-xs text-brand-muted">
                    <p className="font-semibold text-brand-dark flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Next steps:</p>
                    <p>1. Open <strong className="text-brand-dark">Missions</strong> to claim your first rescue task.</p>
                    <p>2. Start with low-risk tasks — trust for fostering &amp; transport grows as you complete verified missions.</p>
                    <p>3. Check the <strong className="text-brand-dark">Rescue Map</strong> for active cases near you.</p>
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
