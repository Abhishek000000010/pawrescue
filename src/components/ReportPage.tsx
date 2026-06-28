import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, MapPin, ShieldAlert, Heart, Activity, AlertCircle, 
  User, Phone, Compass, ArrowRight, Shield, HeartHandshake, 
  HelpCircle, Sparkles, CheckCircle2, ChevronRight, PhoneCall 
} from 'lucide-react';
import { StrayCat } from '../types';

interface ReportPageProps {
  onReportSuccess: (newCat: Partial<StrayCat>) => void;
  onNavigateHome: () => void;
}

export default function ReportPage({ onReportSuccess, onNavigateHome }: ReportPageProps) {
  // Form State
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [healthStatus, setHealthStatus] = useState<'Healthy' | 'Injured' | 'Mother/Kittens' | 'Sick'>('Healthy');
  const [colorMarkings, setColorMarkings] = useState('');
  const [estimatedAge, setEstimatedAge] = useState('Kitten (0-6 months)');
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>(['Friendly']);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  // File for backend upload
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // AI severity feedback
  const [aiSeverity, setAiSeverity] = useState<{ severity: string; reason: string; imageUrl: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendResponse, setBackendResponse] = useState<any>(null);
  
  // Statuses
  const [isDragging, setIsDragging] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');

  // Real Camera & Coordinates State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Clean up camera on unmount
  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError('Unable to access camera. Please verify camera permissions are granted. For the best experience, open this app in a new tab.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhoto(dataUrl);
        // Convert canvas to File for backend upload
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setPhotoFile(file);
            analyzePhotoWithAI(file);
          }
        }, 'image/jpeg');
        // Automatically fetch real coordinates when a photo is taken!
        setTimeout(() => {
          handleAutoLocate();
        }, 300);
      }
    }
    stopCamera();
  };

  // Send photo to backend AI analysis endpoint for live severity feedback
  const analyzePhotoWithAI = async (file: File) => {
    const token = localStorage.getItem('pawnet_token');
    if (!token) return; // Need to be logged in

    setIsAnalyzing(true);
    setAiSeverity(null);

    try {
      const formData = new FormData();
      formData.append('photos', file);

      const response = await fetch('/api/cats/analyze', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAiSeverity(data);
        if (data.healthStatus) {
          setHealthStatus(data.healthStatus as any);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('AI analysis API error:', response.status, errData);
        setAiSeverity({
          severity: 'moderate',
          reason: `Upload failed (Status ${response.status}). ${errData.message || 'Please submit manually.'}`,
          imageUrl: ''
        });
      }
    } catch (err) {
      console.error('AI analysis failed:', err);
      setAiSeverity({
        severity: 'moderate',
        reason: 'Network error analyzing photo. Please submit manually.',
        imageUrl: ''
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Preset Mock photos for simple sandbox file simulation
  const mockPresetPhotos = [
    {
      url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400',
      label: 'Ginger Tabby'
    },
    {
      url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400',
      label: 'Stray Calico'
    },
    {
      url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=400',
      label: 'Scared Kitten'
    },
    {
      url: 'https://images.unsplash.com/photo-1574158622643-69d34d72650a?auto=format&fit=crop&q=80&w=400',
      label: 'White stray'
    }
  ];

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
        setTimeout(() => { handleAutoLocate(); }, 300);
      };
      reader.readAsDataURL(file);
      analyzePhotoWithAI(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target?.result as string);
        setTimeout(() => { handleAutoLocate(); }, 300);
      };
      reader.readAsDataURL(file);
      analyzePhotoWithAI(file);
    }
  };

  const toggleBehavior = (behavior: string) => {
    if (selectedBehaviors.includes(behavior)) {
      setSelectedBehaviors(selectedBehaviors.filter(b => b !== behavior));
    } else {
      setSelectedBehaviors([...selectedBehaviors, behavior]);
    }
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
        setLocation(`Evergreen Avenue (Mock GPS: ${fallbackLat.toFixed(5)}, ${fallbackLng.toFixed(5)}) - Open in new tab for direct GPS`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!photo) {
      setError('Please upload or select a photo of the stray cat.');
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    if (!location.trim()) {
      setError('Please specify where the cat was spotted.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('pawnet_token');
      const formData = new FormData();

      // Attach photo file if available
      if (photoFile) {
        formData.append('photos', photoFile);
      }

      // Form fields
      formData.append('address', location);
      formData.append('area', '');
      formData.append('city', '');
      formData.append('lat', String(coordinates?.lat || 28.6139));
      formData.append('lng', String(coordinates?.lng || 77.2090));
      formData.append('condition', `${colorMarkings || 'Mixed'} - ${healthStatus}`);
      formData.append('healthStatus', healthStatus);
      if (aiSeverity) {
        formData.append('severity', aiSeverity.severity);
        formData.append('aiSeverityReason', aiSeverity.reason);
      }
      formData.append('colorMarkings', colorMarkings);
      formData.append('estimatedAge', estimatedAge);
      formData.append('behaviors', JSON.stringify(selectedBehaviors));
      formData.append('contactName', contactName);
      formData.append('contactPhone', contactPhone);
      formData.append('tags', JSON.stringify([healthStatus, ...selectedBehaviors]));
      formData.append('name', `${colorMarkings.split(' ')[0] || 'Spotted'} ${estimatedAge.includes('Kitten') ? 'Kitten' : 'Stray'}`);

      const response = await fetch('/api/cats', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setBackendResponse(data);
        onReportSuccess({
          id: data._id,
          name: data.name,
          image: data.photos?.[0] || photo,
          location,
          status: healthStatus === 'Injured' || healthStatus === 'Sick' ? 'Urgent' : 'Stable',
          description: `AI Severity: ${data.severity} — ${data.aiSeverityReason}`,
          breed: colorMarkings || 'Mixed Breed',
          age: estimatedAge,
          gender: 'Male',
          reportedAt: 'Just now',
          tags: [healthStatus, ...selectedBehaviors],
        });
        setFormSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setPhoto(null);
    setPhotoFile(null);
    setLocation('');
    setHealthStatus('Healthy');
    setColorMarkings('');
    setEstimatedAge('Kitten (0-6 months)');
    setSelectedBehaviors(['Friendly']);
    setContactName('');
    setContactPhone('');
    setFormSubmitted(false);
    setError('');
    setCoordinates(null);
    setAiSeverity(null);
    setBackendResponse(null);
    setIsSubmitting(false);
  };


  return (
    <div id="report-view-container" className="bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen pt-24 pb-16 transition-colors duration-300">
      
      {/* ================= HERO TEXT BLOCK BANNER ================= */}
      <section className="relative overflow-hidden py-16 px-6 max-w-7xl mx-auto rounded-3xl mb-8 bg-gradient-to-br from-zinc-100 via-white to-zinc-50 dark:from-zinc-900/60 dark:via-zinc-900 dark:to-zinc-950/80 border border-zinc-200/50 dark:border-zinc-800/40">
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 dark:opacity-5 pointer-events-none bg-[url('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1 bg-[#FDF2EC] dark:bg-brand-primary/10 text-brand-primary dark:text-brand-primary-hover px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase">
            Rescue Mission
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-50 leading-tight">
            Every Report is a <br />
            <span className="text-brand-primary">Chance for a Home.</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
            Seen a stray in need? Your quick action can be the start of a beautiful recovery story.
            Tell us what you saw, and our dedicated rescue teams will take it from there.
          </p>
        </div>
      </section>

      {/* ================= PRIMARY GRID LAYOUT ================= */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ================= LEFT COLUMN: DYNAMIC FORM CONTAINER (2/3 cols) ================= */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!formSubmitted ? (
              <motion.div
                key="report-form-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-[0_4px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-8"
              >
                
                {/* Error Banner */}
                {error && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl text-xs font-semibold"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* STEP 1: UPLOAD PHOTOS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-brand-primary text-white flex items-center justify-center font-black text-sm">
                        1
                      </div>
                      <h3 className="font-heading text-lg font-black text-zinc-800 dark:text-zinc-100">
                        Upload Photos
                      </h3>
                    </div>

                    {/* Drag & Drop Box exactly matching visual specs */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all ${
                        isDragging
                          ? 'border-brand-primary bg-brand-primary/5'
                          : photo || isCameraActive
                          ? 'border-emerald-500/50 bg-emerald-500/5'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-brand-primary bg-zinc-50/50 dark:bg-zinc-950/20'
                      }`}
                    >
                      {isCameraActive ? (
                        <div className="relative w-full aspect-video sm:aspect-[2.3/1] rounded-2xl overflow-hidden bg-black flex flex-col items-center justify-center shadow-lg border border-zinc-700/30">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4 z-20">
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-black text-white uppercase tracking-wider shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform"
                            >
                              <Camera className="h-4 w-4" />
                              <span>Capture Photo</span>
                            </button>
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-black text-white uppercase tracking-wider active:scale-95 transition-transform"
                            >
                              Cancel
                            </button>
                          </div>
                          {cameraError && (
                            <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-30">
                              <AlertCircle className="h-8 w-8 text-red-500 animate-bounce" />
                              <p className="text-xs font-black text-red-400 max-w-xs">{cameraError}</p>
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-bold"
                              >
                                Close
                              </button>
                            </div>
                          )}
                        </div>
                      ) : photo ? (
                        <div className="space-y-3">
                          <div className="relative w-full aspect-video sm:aspect-[2.3/1] rounded-2xl overflow-hidden group shadow-inner">
                            <img src={photo} alt="Reported stray upload" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setPhoto(null);
                                  setPhotoFile(null);
                                  setCoordinates(null);
                                  setAiSeverity(null);
                                }}
                                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-700 transition-all shadow-lg uppercase tracking-wider"
                              >
                                Remove Image
                              </button>
                            </div>
                          </div>
                          
                          {/* AI Severity Feedback Badge */}
                          {isAnalyzing && (
                            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl px-4 py-3 animate-pulse">
                              <Sparkles className="h-4 w-4 text-amber-500 animate-spin" />
                              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">AI is assessing the cat's condition...</span>
                            </div>
                          )}
                          {aiSeverity && !isAnalyzing && (
                            <div className={`flex items-start gap-3 rounded-2xl px-4 py-3 border ${
                              aiSeverity.severity === 'critical' 
                                ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40' 
                                : aiSeverity.severity === 'moderate' 
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40' 
                                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40'
                            }`}>
                              <Sparkles className={`h-4 w-4 mt-0.5 shrink-0 ${
                                aiSeverity.severity === 'critical' ? 'text-red-500' 
                                : aiSeverity.severity === 'moderate' ? 'text-amber-500' 
                                : 'text-emerald-500'
                              }`} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                                    aiSeverity.severity === 'critical' ? 'text-red-600 dark:text-red-400' 
                                    : aiSeverity.severity === 'moderate' ? 'text-amber-600 dark:text-amber-400' 
                                    : 'text-emerald-600 dark:text-emerald-400'
                                  }`}>
                                    AI Severity: {aiSeverity.severity}
                                  </span>
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                                    aiSeverity.severity === 'critical' ? 'bg-red-500 text-white' 
                                    : aiSeverity.severity === 'moderate' ? 'bg-amber-500 text-white' 
                                    : 'bg-emerald-500 text-white'
                                  }`}>
                                    {aiSeverity.severity}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">{aiSeverity.reason}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center space-y-3">
                          <div className="h-14 w-14 rounded-full bg-[#FDF2EC] dark:bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                            <Camera className="h-7 w-7" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-zinc-800 dark:text-zinc-100">
                              Direct Camera Capture & Upload
                            </p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs leading-relaxed">
                              Take a live photo directly using your device's camera, or upload from files.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3 justify-center pt-1">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl shadow-sm transition-all gap-1.5 active:scale-95"
                            >
                              <Camera className="h-4 w-4" />
                              <span>Take Photo</span>
                            </button>
                            <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-brand-primary rounded-xl hover:bg-brand-primary-hover shadow-sm transition-all active:scale-95">
                              Browse Files
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Simulators */}
                    {!photo && !isCameraActive && (
                      <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40">
                        <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-2.5">
                          Simulation Presets (Select one to auto-pin)
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {mockPresetPhotos.map((preset, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setPhoto(preset.url);
                                setTimeout(() => {
                                  handleAutoLocate();
                                }, 300);
                              }}
                              className="flex items-center gap-1.5 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-brand-primary dark:hover:border-brand-primary bg-white dark:bg-zinc-900 text-left transition-colors"
                            >
                              <img src={preset.url} alt={preset.label} className="h-7 w-7 rounded-lg object-cover" />
                              <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 truncate">
                                {preset.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* STEP 2: LOCATION DETAILS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-brand-primary text-white flex items-center justify-center font-black text-sm">
                        2
                      </div>
                      <h3 className="font-heading text-lg font-black text-zinc-800 dark:text-zinc-100">
                        Location Details
                      </h3>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                        STREET ADDRESS OR LANDMARK
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Near the Central Park entrance..."
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 pl-10 pr-4 py-3.5 text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-brand-primary focus:outline-none transition-all font-medium"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAutoLocate}
                          className="px-4 py-3 bg-[#E8E8E6] dark:bg-zinc-800 hover:bg-brand-primary hover:text-white dark:hover:bg-brand-primary text-zinc-700 dark:text-zinc-300 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-98"
                        >
                          <Compass className={`h-4 w-4 ${isLocating ? 'animate-spin text-brand-primary' : ''}`} />
                          <span>{isLocating ? 'Locating...' : 'Current'}</span>
                        </button>
                      </div>
                    </div>

                    {/* VECTOR FOLDING PERSPECTIVE MAP ACCENTS */}
                    <div className="relative rounded-2xl overflow-hidden h-40 border border-zinc-200 dark:border-zinc-800 bg-[#E8EDEA] flex items-center justify-center">
                      {/* Stylized CSS folding paper grid */}
                      <div className="absolute inset-0 opacity-40 dark:opacity-20 bg-[radial-gradient(#115E59_1px,transparent_1px)] [background-size:16px_16px]" />
                      
                      {/* Folding Perspective Shadows */}
                      <div className="absolute inset-y-0 left-1/3 w-px bg-black/15 shadow-2xl transform skew-x-3 pointer-events-none" />
                      <div className="absolute inset-y-0 right-1/3 w-px bg-black/15 shadow-2xl transform -skew-x-3 pointer-events-none" />
                      
                      <div className="absolute top-8 left-1/4 h-2 w-32 bg-emerald-700/10 rounded-full blur-xs" />
                      <div className="absolute top-16 right-1/4 h-4 w-40 bg-emerald-700/15 rounded-full blur-xs" />
                      
                      {/* Map road vectors */}
                      <svg className="absolute inset-0 w-full h-full text-white/50 dark:text-zinc-800/30" xmlns="http://www.w3.org/2000/svg">
                        <line x1="0" y1="50" x2="1000" y2="120" stroke="currentColor" strokeWidth="8" />
                        <line x1="120" y1="0" x2="200" y2="400" stroke="currentColor" strokeWidth="6" />
                        <line x1="380" y1="0" x2="310" y2="400" stroke="currentColor" strokeWidth="5" />
                        <line x1="0" y1="130" x2="1000" y2="20" stroke="currentColor" strokeWidth="4" />
                      </svg>

                      {/* Map Pins */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="relative">
                          <span className="absolute -top-1 -left-1 h-8 w-8 rounded-full bg-brand-primary/30 animate-ping" />
                          <div className="h-6 w-6 rounded-full bg-brand-primary text-white border-2 border-white shadow-lg flex items-center justify-center relative z-10 animate-bounce">
                            <MapPin className="h-3 w-3" />
                          </div>
                        </div>
                        {coordinates ? (
                          <div className="mt-2 bg-zinc-900/95 text-white border border-zinc-700/50 px-3.5 py-2 rounded-2xl shadow-xl text-[10px] animate-fade-in text-center font-medium max-w-[270px] leading-relaxed">
                            <span className="font-black text-[#D97706] block uppercase tracking-wider text-[9px] mb-0.5">🛰️ Telemetry Latched</span>
                            Lat: <span className="font-mono text-zinc-300 font-bold">{coordinates.lat.toFixed(6)}</span>, Lng: <span className="font-mono text-zinc-300 font-bold">{coordinates.lng.toFixed(6)}</span>
                          </div>
                        ) : location ? (
                          <div className="mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1 rounded-full shadow-md text-[9px] font-extrabold tracking-wide uppercase text-brand-primary animate-fade-in truncate max-w-xs">
                            📍 Reported Site Connected
                          </div>
                        ) : (
                          <div className="mt-2 bg-zinc-800/85 text-white px-3 py-1 rounded-full shadow-md text-[9px] font-bold tracking-wide uppercase">
                            Spotter Pointer Ready
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* STEP 3: CAT CHARACTERISTICS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-brand-primary text-white flex items-center justify-center font-black text-sm">
                        3
                      </div>
                      <h3 className="font-heading text-lg font-black text-zinc-800 dark:text-zinc-100">
                        Cat Characteristics
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Health Status Selector Grid */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                          Health Status
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'Healthy', label: 'Healthy', icon: Shield, color: 'text-emerald-500 bg-emerald-500/10' },
                            { id: 'Injured', label: 'Injured', icon: ShieldAlert, color: 'text-red-500 bg-red-500/10' },
                            { id: 'Mother/Kittens', label: 'Mother/Kittens', icon: Heart, color: 'text-blue-500 bg-blue-500/10' },
                            { id: 'Sick', label: 'Sick', icon: Activity, color: 'text-amber-500 bg-amber-500/10' }
                          ].map((item) => {
                            const Icon = item.icon;
                            const isSelected = healthStatus === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setHealthStatus(item.id as any)}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center ${
                                  isSelected
                                    ? 'border-brand-primary bg-brand-primary/5 shadow-inner scale-98'
                                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50'
                                }`}
                              >
                                <div className={`p-2 rounded-xl mb-2 ${item.color}`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <span className={`text-xs font-black uppercase tracking-wide ${isSelected ? 'text-brand-primary' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                  {item.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right details inputs */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                            COLOR & MARKINGS
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Tabby with white paws"
                            value={colorMarkings}
                            onChange={(e) => setColorMarkings(e.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 px-4 py-3.5 text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-brand-primary focus:outline-none transition-all font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                            ESTIMATED AGE
                          </label>
                          <select
                            value={estimatedAge}
                            onChange={(e) => setEstimatedAge(e.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 px-4 py-3.5 text-xs text-zinc-800 dark:text-zinc-100 focus:border-brand-primary focus:outline-none transition-all font-semibold cursor-pointer"
                          >
                            <option value="Kitten (0-6 months)">Kitten (0-6 months)</option>
                            <option value="Juvenile (6-12 months)">Juvenile (6-12 months)</option>
                            <option value="Adult (1-7 years)">Adult (1-7 years)</option>
                            <option value="Senior (7+ years)">Senior (7+ years)</option>
                          </select>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* STEP 4: BEHAVIOR */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-brand-primary text-white flex items-center justify-center font-black text-sm">
                        4
                      </div>
                      <h3 className="font-heading text-lg font-black text-zinc-800 dark:text-zinc-100">
                        Behavior
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {['Friendly', 'Scared/Shy', 'Vocal', 'Aggressive', 'Tame'].map((behavior) => {
                        const isSelected = selectedBehaviors.includes(behavior);
                        return (
                          <button
                            key={behavior}
                            type="button"
                            onClick={() => toggleBehavior(behavior)}
                            className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all ${
                              isSelected
                                ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400'
                            }`}
                          >
                            {behavior}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CONTACT WRAPPER INFO BOX */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
                        Your Contact (Optional)
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal mt-0.5">
                        We might need to call you for more specific location details.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-10 pr-4 py-2.5 text-xs text-zinc-800 dark:text-zinc-100 focus:border-brand-primary focus:outline-none font-medium"
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-10 pr-4 py-2.5 text-xs text-zinc-800 dark:text-zinc-100 focus:border-brand-primary focus:outline-none font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full rounded-2xl text-white py-4 text-sm font-extrabold uppercase tracking-widest shadow-lg shadow-brand-primary/15 transition-all flex items-center justify-center gap-2 ${
                      isSubmitting ? 'bg-brand-primary/70 cursor-not-allowed' : 'bg-brand-primary hover:bg-brand-primary-hover hover:translate-y-[-1px]'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Sparkles className="h-5 w-5 animate-spin" />
                        <span>Submitting & Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Rescue Report</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>

                </form>
              </motion.div>
            ) : (
              // SUCCESS ANIMATION CONTAINER
              <motion.div
                key="report-success-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-8 text-center space-y-6"
              >
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 relative">
                  <span className="absolute inset-0 h-20 w-20 rounded-full bg-emerald-500/20 animate-ping opacity-60" />
                  <CheckCircle2 className="h-12 w-12" />
                </div>

                <div className="space-y-2">
                  <h2 className="font-heading text-2xl font-black text-zinc-800 dark:text-white flex items-center justify-center gap-2">
                    Report Broadcasted! <Sparkles className="h-6 w-6 text-amber-500 fill-amber-500" />
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Thank you so much! A localized dispatch has been initiated. Nearby volunteer guardians within a 3km radius have been notified instantly.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAF9F6] dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 p-5 text-left space-y-3 text-xs max-w-lg mx-auto">
                  <h4 className="font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[10px]">
                    Live Operations Summary
                  </h4>
                  <div className="space-y-2 text-zinc-500 dark:text-zinc-400 font-medium">
                    {backendResponse && (
                      <>
                        <p className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-purple-500" />
                          <span><strong>Cat ID:</strong> <span className="font-mono text-zinc-700 dark:text-zinc-300">{backendResponse._id}</span></span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${
                            backendResponse.severity === 'critical' ? 'bg-red-500' 
                            : backendResponse.severity === 'moderate' ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                          } animate-pulse`} />
                          <span>
                            <strong>AI Severity:</strong>{' '}
                            <span className={`font-black uppercase ${
                              backendResponse.severity === 'critical' ? 'text-red-500' 
                              : backendResponse.severity === 'moderate' ? 'text-amber-500' 
                              : 'text-emerald-500'
                            }`}>
                              {backendResponse.severity}
                            </span>
                            {' — '}{backendResponse.aiSeverityReason}
                          </span>
                        </p>
                      </>
                    )}
                    <p className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
                      <span><strong>Scouts Notified:</strong> 14 active volunteers checking coordinates</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span><strong>Location Spot:</strong> {location}</span>
                    </p>
                    {coordinates && (
                      <p className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        <span><strong>GPS Latency:</strong> Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)} (Target Locked)</span>
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <span><strong>Details Registered:</strong> {colorMarkings || 'Stray cat'} ({healthStatus})</span>
                    </p>
                    <p className="pt-2 text-[10px] text-amber-600 dark:text-amber-400 border-t border-zinc-200/60 dark:border-zinc-800/60 font-black uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Note: Keep a safe distance. Do not provoke.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-6 py-3 text-xs font-black text-zinc-500 hover:bg-zinc-50 uppercase tracking-wider transition-colors"
                  >
                    Submit Another
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateHome}
                    className="rounded-xl bg-brand-primary hover:bg-brand-primary-hover px-6 py-3 text-xs font-black text-white uppercase tracking-wider shadow-md shadow-brand-primary/10 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Back to Portal Home</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ================= RIGHT COLUMN: INTERACTIVE SIDEBAR (1/3 cols) ================= */}
        <div className="space-y-6">
          
          {/* WHAT HAPPENS NEXT TIMELINE SIDEBAR CARD */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border-l-4 border-l-brand-primary border-y border-r border-zinc-200/80 dark:border-zinc-800 p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
            <h3 className="font-heading text-sm font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-widest mb-6">
              What Happens Next?
            </h3>

            <div className="space-y-5">
              {[
                {
                  step: 1,
                  title: 'Dispatch Alert',
                  desc: 'Nearby volunteers and rescue units are notified instantly with your photos and location.'
                },
                {
                  step: 2,
                  title: 'Field Assessment',
                  desc: 'A trained responder arrives to check the cat’s health and determine the best care path.'
                },
                {
                  step: 3,
                  title: 'Safe Transport',
                  desc: 'If needed, the cat is safely trapped and transported to our partner vets or recovery center.'
                },
                {
                  step: 4,
                  title: 'Recovery & Adoption',
                  desc: 'Once healthy, we list them for adoption or return to colony if they are wild and healthy.'
                }
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start">
                  <div className="h-6 w-6 rounded-full bg-[#FDF2EC] dark:bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center shrink-0 border border-brand-primary/20">
                    {item.step}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-100">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QUOTE TESTIMONIAL CARD WITH OVERLAY bg */}
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-[1.5/1] lg:aspect-[4/3] group shadow-md border border-zinc-200/40 dark:border-zinc-800/40">
            <img 
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400" 
              alt="Community Guardian holding cat" 
              className="absolute inset-0 h-full w-full object-cover group-hover:scale-102 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/60 to-zinc-950/10" />
            
            <div className="absolute inset-x-5 bottom-5 text-white space-y-2">
              <p className="text-xs italic leading-relaxed text-zinc-100 font-medium">
                "Reporting Luna was the best thing I did. Two months later, she's in a forever home!"
              </p>
              <div className="flex justify-between items-center pt-1 border-t border-white/10">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">
                  — Sarah, Community Hero
                </span>
                <span className="text-[8px] bg-white/20 text-white px-2 py-0.5 rounded uppercase tracking-widest font-extrabold">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* EMERGENCY HOTLINE CARD */}
          <div className="bg-zinc-100/60 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 p-6 shadow-sm text-center space-y-4">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/20 text-red-500 flex items-center justify-center mx-auto shadow-sm">
              <PhoneCall className="h-5 w-5" />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-widest">
                Severe Emergency?
              </h4>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto leading-normal font-medium">
                If the cat is in immediate life-threatening danger, call our hotline.
              </p>
            </div>

            <a 
              href="tel:1-800-PAW-HELP"
              className="block font-heading text-xl font-black text-brand-primary dark:text-brand-primary hover:scale-[1.02] transition-transform select-all"
            >
              1-800-PAW-HELP
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}
