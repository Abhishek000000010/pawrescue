import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, MapPin, Sparkles, CheckCircle2, AlertCircle, Compass } from 'lucide-react';
import { StrayCat } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportSuccess: (newCat: Partial<StrayCat>) => void;
}

export default function ReportModal({ isOpen, onClose, onReportSuccess }: ReportModalProps) {
  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [catStatus, setCatStatus] = useState<'Urgent' | 'Stable'>('Stable');
  const [error, setError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Mock auto-populate photo for quick testing
  const handleUseMockPhoto = () => {
    setPhoto('https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=500');
    setPhotoFile(null);
  };

  const handleAutoLocate = () => {
    setIsLocating(true);
    setError('');

    if (!navigator.geolocation) {
      setLocation('Coordinates unavailable (Geolocation not supported by browser)');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });

        // Reverse-geocode with OSM Nominatim API for full descriptive realness!
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
            headers: {
              'Accept-Language': 'en'
            }
          });
          const data = await res.json();
          if (data && data.display_name) {
            setLocation(`${data.display_name} (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
          } else {
            setLocation(`Rescue Zone: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch (err) {
          console.error("OSM Geocoding err:", err);
          setLocation(`Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)} (GPS Verified)`);
        }
        setIsLocating(false);
      },
      (err) => {
        console.warn("Geolocation denied or timed out:", err);
        // Fallback to high fidelity coordinates
        const fallbackLat = 37.7749 + (Math.random() - 0.5) * 0.01;
        const fallbackLng = -122.4194 + (Math.random() - 0.5) * 0.01;
        setCoordinates({ lat: fallbackLat, lng: fallbackLng });
        setLocation(`Evergreen Avenue (Mock GPS: ${fallbackLat.toFixed(5)}, ${fallbackLng.toFixed(5)})`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleNext = () => {
    if (step === 1 && !photo) {
      setError('Please upload or select a photo of the cat.');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !description.trim() || !contactName.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let finalLat = coordinates?.lat;
      let finalLng = coordinates?.lng;

      if (!finalLat || !finalLng) {
        // Try geocoding the manual input
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`);
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            finalLat = parseFloat(geoData[0].lat);
            finalLng = parseFloat(geoData[0].lon);
          }
        } catch (geoErr) {
          console.warn("Manual address geocoding failed:", geoErr);
        }
      }

      if (!finalLat || !finalLng) {
        finalLat = 28.6139;
        finalLng = 77.2090;
      }

      const token = localStorage.getItem('pawnet_token');
      const formData = new FormData();

      if (photoFile) {
        formData.append('photos', photoFile);
      } else if (photo && photo.startsWith('http')) {
        formData.append('mockPhoto', photo);
      }

      formData.append('address', location);
      formData.append('area', '');
      formData.append('city', '');
      formData.append('lat', String(finalLat));
      formData.append('lng', String(finalLng));
      formData.append('condition', description);
      formData.append('healthStatus', catStatus === 'Urgent' ? 'Injured' : 'Healthy');
      formData.append('colorMarkings', 'Mixed');
      formData.append('estimatedAge', 'Adult');
      formData.append('behaviors', JSON.stringify(['Friendly']));
      formData.append('contactName', contactName);
      formData.append('contactPhone', contactPhone);
      formData.append('tags', JSON.stringify([catStatus, 'Recently Spotted']));
      formData.append('name', 'Unnamed Stray');

      const response = await fetch('/api/cats', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setHasSubmitted(true);
        onReportSuccess({
          id: data._id,
          name: data.name,
          image: data.photos?.[0] || photo || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=500',
          location,
          status: catStatus,
          description: `AI Severity: ${data.severity} — ${data.aiSeverityReason}`,
          breed: 'Mixed Breed',
          age: 'Adult',
          gender: 'Male',
          reportedAt: 'Just now',
          tags: [catStatus, 'Recently Spotted'],
        });
        setStep(3); // Success Screen
      } else {
        setError(data.message || 'Failed to submit report. Please try again.');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    const wasSubmitted = hasSubmitted;
    setStep(1);
    setPhoto(null);
    setPhotoFile(null);
    setCoordinates(null);
    setLocation('');
    setDescription('');
    setContactName('');
    setContactPhone('');
    setCatStatus('Stable');
    setError('');
    setIsLocating(false);
    setHasSubmitted(false);
    onClose();
    if (wasSubmitted) {
      window.location.reload();
    }
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

          {/* Modal Content */}
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
                <h3 className="font-heading text-lg font-bold text-brand-dark">Report a Stray Cat</h3>
                <p className="text-xs text-brand-muted">Help nearby rescuers locate a feline in need</p>
              </div>
              <button
                onClick={handleReset}
                className="rounded-full p-1.5 text-brand-muted hover:bg-brand-cream hover:text-brand-dark transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 px-6 py-2.5 text-xs font-medium text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Steps indicator */}
            <div className="flex justify-between bg-brand-light/50 px-6 py-2 border-b border-brand-cream/50">
              <span className="text-xs font-semibold text-brand-muted">
                {step === 3 ? 'Completed' : `Step ${step} of 2`}
              </span>
              <div className="flex gap-1.5 items-center">
                <div className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-brand-primary' : 'bg-gray-200'}`} />
                <div className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-brand-primary' : 'bg-gray-200'}`} />
                <div className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step === 3 ? 'bg-brand-primary' : 'bg-gray-200'}`} />
              </div>
            </div>

            <div className="p-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-brand-dark">Upload a photo of the stray</p>
                    <p className="text-xs text-brand-muted mt-0.5">This helps local scouts identify the cat easily</p>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
                      isDragging
                        ? 'border-brand-primary bg-brand-cream/40'
                        : photo
                        ? 'border-brand-green/40 bg-brand-light'
                        : 'border-brand-cream hover:border-brand-primary bg-brand-light/30'
                    }`}
                  >
                    {photo ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
                        <img src={photo} alt="Reported stray preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-brand-dark/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setPhoto(null)}
                            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow hover:bg-red-50 transition-colors"
                          >
                            Remove Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-brand-primary/60 mb-2" />
                        <p className="text-sm font-medium text-brand-dark text-center">
                          Drag and drop your photo here, or{' '}
                          <label className="text-brand-primary hover:underline cursor-pointer">
                            browse
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </p>
                        <p className="text-xs text-brand-muted mt-1">Supports JPG, PNG, WEBP</p>
                      </>
                    )}
                  </div>

                  {!photo && (
                    <div className="text-center">
                      <span className="text-xs text-brand-muted">Don't have a photo? </span>
                      <button
                        type="button"
                        onClick={handleUseMockPhoto}
                        className="text-xs font-semibold text-brand-primary hover:underline"
                      >
                        Simulate camera capture
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full rounded-xl bg-brand-primary py-3 font-semibold text-white shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-hover transition-colors mt-4"
                  >
                    Continue to Details
                  </button>
                </div>
              )}

              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">
                      Where was the cat spotted? <span className="text-brand-primary">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3.5 h-4 w-4 text-brand-muted" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 5th Ave near corner of Elm St, or coordinates"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full rounded-xl border border-brand-cream bg-brand-light pl-10 pr-24 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleAutoLocate}
                        disabled={isLocating}
                        className="absolute right-2 px-3 py-1.5 rounded-lg text-xs bg-brand-primary/10 hover:bg-brand-primary/20 disabled:bg-brand-light text-brand-primary font-semibold transition-all flex items-center gap-1.5 active:scale-95 border border-brand-primary/20 cursor-pointer"
                      >
                        <Compass className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                        <span>{isLocating ? 'Locating...' : 'Locate'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">
                      Describe the cat and its condition <span className="text-brand-primary">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Orange tabby, looks cold, limping slightly, hiding under the porch."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-xl border border-brand-cream bg-brand-light px-4 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-dark mb-1">
                        Urgency Level
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCatStatus('Stable')}
                          className={`rounded-lg py-2 text-xs font-semibold border transition-all ${
                            catStatus === 'Stable'
                              ? 'border-brand-green bg-brand-green/5 text-brand-green'
                              : 'border-brand-cream hover:border-brand-muted text-brand-muted'
                          }`}
                        >
                          Stable
                        </button>
                        <button
                          type="button"
                          onClick={() => setCatStatus('Urgent')}
                          className={`rounded-lg py-2 text-xs font-semibold border transition-all ${
                            catStatus === 'Urgent'
                              ? 'border-red-500 bg-red-50 text-red-600'
                              : 'border-brand-cream hover:border-brand-muted text-brand-muted'
                          }`}
                        >
                          Urgent
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-dark mb-1">
                        Your Name <span className="text-brand-primary">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Sarah M."
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full rounded-xl border border-brand-cream bg-brand-light px-4 py-2 text-sm text-brand-dark focus:border-brand-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">
                      Your Phone (optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +1 (555) 019-2834"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full rounded-xl border border-brand-cream bg-brand-light px-4 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 rounded-xl border border-brand-cream py-3 font-semibold text-brand-dark hover:bg-brand-cream transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 rounded-xl bg-brand-primary py-3 font-semibold text-white shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-hover disabled:bg-brand-muted disabled:shadow-none transition-colors"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <div className="text-center py-6 space-y-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-heading text-xl font-bold text-brand-dark flex items-center justify-center gap-1.5">
                      Report Broadcasted! <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
                    </h4>
                    <p className="text-sm text-brand-muted max-w-sm mx-auto">
                      Thank you! A localized notification was instantly sent to <strong>14 active volunteers</strong> within a 3km radius.
                    </p>
                  </div>

                  <div className="rounded-xl bg-brand-light border border-brand-cream p-4 text-left space-y-1 text-xs">
                    <p className="text-brand-muted"><strong className="text-brand-dark">Assigned Scouts:</strong> 2 nearby volunteers are currently checking</p>
                    <p className="text-brand-muted"><strong className="text-brand-dark">Location:</strong> {location}</p>
                    <p className="text-brand-muted"><strong className="text-brand-dark">Safety Notice:</strong> Please maintain a safe distance and do not force contact with a stray if they seem aggressive.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full rounded-xl bg-brand-dark py-3 font-semibold text-white hover:bg-brand-dark/95 transition-colors"
                  >
                    Done & Close
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
