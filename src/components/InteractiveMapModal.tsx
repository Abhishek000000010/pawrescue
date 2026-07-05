import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, MapPin, Eye, Bell, Star, Navigation, Info, Layers, 
  CheckCircle2, AlertTriangle, Plus, Droplets, User, Check, 
  Activity, Clock, RotateCcw, Sparkles, ShieldAlert, Heart
} from 'lucide-react';

interface Colony {
  id: string;
  name: string;
  location: string;
  catsCount: number;
  foodLevel: number; // 0-100
  waterLevel: number; // 0-100
  caretaker: string;
  status: 'Stable' | 'Critical' | 'Warning';
  lat: number; // percentage from top (0-100)
  lng: number; // percentage from left (0-100)
}

interface Mission {
  id: string;
  title: string;
  type: 'Trap-Neuter-Return' | 'Vet Transport' | 'Emergency Rescue' | 'Daily Feeding';
  assignedTo: string | null;
  status: 'Pending' | 'In Progress' | 'Completed';
  urgency: 'Low' | 'Medium' | 'High';
  lat: number;
  lng: number;
  eta: string;
  description: string;
}

interface StateReport {
  id: string;
  catName: string;
  image: string;
  reporter: string;
  time: string;
  status: 'Pending Action' | 'Dispatched' | 'Resolved';
  description: string;
  lat: number;
  lng: number;
}

interface InteractiveMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportTrigger: () => void;
}

// Initial mockup data for the hackathon
const INITIAL_COLONIES: Colony[] = [
  {
    id: 'c1',
    name: 'Industrial Park Colony',
    location: 'Sector 4-B (Warehouse District)',
    catsCount: 15,
    foodLevel: 12,
    waterLevel: 45,
    caretaker: 'Markus Vance',
    status: 'Critical',
    lat: 38,
    lng: 28,
  },
  {
    id: 'c2',
    name: 'Oak Park Pavilions',
    location: 'Sector 2-A (Oak Park West)',
    catsCount: 8,
    foodLevel: 85,
    waterLevel: 90,
    caretaker: 'Sarah Jenkins',
    status: 'Stable',
    lat: 62,
    lng: 72,
  },
  {
    id: 'c3',
    name: 'Waterfront Wharf 4',
    location: 'Sector 9-C (Harbor Docks)',
    catsCount: 22,
    foodLevel: 40,
    waterLevel: 35,
    caretaker: 'Elena Rostova',
    status: 'Warning',
    lat: 78,
    lng: 35,
  },
];

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Vet Shuttle: Mochi Vaccination',
    type: 'Vet Transport',
    assignedTo: null,
    status: 'Pending',
    urgency: 'Medium',
    lat: 25,
    lng: 60,
    eta: 'Today, 2:00 PM',
    description: 'Provide carrier transport for stray kitten Mochi to local clinic.',
  },
  {
    id: 'm2',
    title: 'TNR Mission: 3 Ferals near Back Alley',
    type: 'Trap-Neuter-Return',
    assignedTo: 'Alex Rivers',
    status: 'In Progress',
    urgency: 'High',
    lat: 48,
    lng: 52,
    eta: 'Active Now',
    description: 'Set traps near alley behind Bistro 10. Bring safety gloves.',
  },
  {
    id: 'm3',
    title: 'Daily Feeding Run: Wharf 4',
    type: 'Daily Feeding',
    assignedTo: 'Elena Rostova',
    status: 'Completed',
    urgency: 'Low',
    lat: 82,
    lng: 31,
    eta: 'Completed 1h ago',
    description: 'Replenish double bowls near container crate #8.',
  }
];

const INITIAL_REPORTS: StateReport[] = [
  {
    id: 'r1',
    catName: 'Limping Black Cat',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200',
    reporter: 'Jonathan K.',
    time: '12 mins ago',
    status: 'Pending Action',
    description: 'Spotted near the old grain silo. Seems unable to put weight on back leg.',
    lat: 18,
    lng: 42,
  },
  {
    id: 'r2',
    catName: 'Calico with 4 Newborns',
    image: 'https://images.unsplash.com/photo-1574158622643-69d34d72650a?auto=format&fit=crop&q=80&w=200',
    reporter: 'Clara Oswald',
    time: '2 hours ago',
    status: 'Dispatched',
    description: 'Nesting under the back steps of public library. Shy but friendly.',
    lat: 53,
    lng: 82,
  }
];

interface LogEntry {
  id: string;
  time: string;
  text: string;
  type: 'info' | 'alert' | 'success' | 'system';
}

export default function InteractiveMapModal({ isOpen, onClose, onReportTrigger }: InteractiveMapModalProps) {
  // Sidebar Tabs: 'colonies' | 'missions' | 'reports'
  const [activeTab, setActiveTab] = useState<'colonies' | 'missions' | 'reports'>('colonies');
  
  // Data States
  const [colonies, setColonies] = useState<Colony[]>(INITIAL_COLONIES);
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [reports, setReports] = useState<StateReport[]>(INITIAL_REPORTS);
  
  // Selected Item to show on details or focus
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [focusedType, setFocusedType] = useState<'colony' | 'mission' | 'report' | null>(null);

  // New report creation placement state
  const [clickCoord, setClickCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  
  // Real-time Event simulation logs
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', time: '14:32:10', text: 'Stray Rescue Node Online', type: 'system' },
    { id: '2', time: '14:34:05', text: 'Live telemetry stream sync completed', type: 'info' },
    { id: '3', time: '14:35:12', text: 'Colony #11 Feeder battery level stable (92%)', type: 'success' },
  ]);

  // Audio/Beep feedbacks (using browser Web Audio API to give premium high-tech feel)
  const playBeep = (freq: number = 800, type: OscillatorType = 'sine', duration: number = 0.08) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignored if browser blocked audio context
    }
  };

  // Helper: Append log
  const addLog = (text: string, type: 'info' | 'alert' | 'success' | 'system' = 'info') => {
    const now = new Date();
    const pad = (num: number) => num.toString().padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setLogs((prev) => [
      { id: Date.now().toString(), time: timeStr, text, type },
      ...prev.slice(0, 15), // keep last 15
    ]);
  };

  // Simulation loop: slowly changes food levels and pushes live background logs to represent "Real-time" aspect
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      // Randomly fluctuate a colony food level or trigger simulated logs
      setColonies((prevColonies) =>
        prevColonies.map((colony) => {
          if (colony.status === 'Critical' && Math.random() > 0.8) {
            // No action
            return colony;
          }
          if (Math.random() > 0.7) {
            const loss = Math.floor(Math.random() * 3) + 1;
            const newFood = Math.max(0, colony.foodLevel - loss);
            const newStatus = newFood < 20 ? 'Critical' : newFood < 50 ? 'Warning' : 'Stable';
            
            if (newFood < 20 && colony.foodLevel >= 20) {
              addLog(`CRITICAL: ${colony.name} food supply fell below 20%!`, 'alert');
              playBeep(440, 'sawtooth', 0.2);
            }
            return { ...colony, foodLevel: newFood, status: newStatus };
          }
          return colony;
        })
      );

      // Random background events to make it feel super alive!
      const randomEvents = [
        () => addLog('Colony #8 Waterfront: Fresh water level fluctuating (Wind/Waves)', 'info'),
        () => addLog('Live Dispatch: Mission #2 GPS signal pinged', 'info'),
        () => addLog('Caretaker Check-in: Markus Vance scheduled food replenishment', 'success'),
        () => addLog('System Telemetry: Neighborhood sector sensor loop verified', 'system'),
      ];

      if (Math.random() > 0.75) {
        randomEvents[Math.floor(Math.random() * randomEvents.length)]();
        playBeep(1200, 'sine', 0.04);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Click on map to place report pin
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const lng = ((e.clientX - rect.left) / rect.width) * 100;
    const lat = ((e.clientY - rect.top) / rect.height) * 100;

    playBeep(900, 'sine', 0.05);
    setClickCoord({ lat, lng });
    setShowQuickForm(true);
    setFocusedId(null);
    setFocusedType(null);
    setActiveTab('reports');
    addLog(`Vector coordinate marker positioned: [LAT: ${lat.toFixed(1)}%, LNG: ${lng.toFixed(1)}%]`, 'system');
  };

  // Submit quick report inside map view
  const handleSubmitQuickReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clickCoord || !newCatName) return;

    const newReport: StateReport = {
      id: `quick-r-${Date.now()}`,
      catName: newCatName,
      image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&q=80&w=200',
      reporter: 'You (Anonymous)',
      time: 'Just Now',
      status: 'Pending Action',
      description: newCatDesc || 'Spotted via Real-time Grid Monitor.',
      lat: clickCoord.lat,
      lng: clickCoord.lng,
    };

    setReports((prev) => [newReport, ...prev]);
    addLog(`ALERT: New community sighting submitted! "${newCatName}"`, 'alert');
    playBeep(600, 'triangle', 0.2);
    
    // Auto-focus the newly added report on the map!
    setFocusedId(newReport.id);
    setFocusedType('report');
    
    // Clear states
    setNewCatName('');
    setNewCatDesc('');
    setShowQuickForm(false);
    setClickCoord(null);
  };

  // Interactive action: Refill colony food/water levels instantly!
  const handleRefillColony = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setColonies((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          addLog(`SUCCESS: Feeders refilled at ${c.name}. Levels: 100%`, 'success');
          playBeep(1000, 'sine', 0.15);
          return { ...c, foodLevel: 100, waterLevel: 100, status: 'Stable' };
        }
        return c;
      })
    );
  };

  // Interactive action: Claim rescue mission
  const handleClaimMission = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          addLog(`MISSION CLAIMED: You accepted "${m.title}". Gear up!`, 'success');
          playBeep(880, 'sine', 0.1);
          return { ...m, assignedTo: 'You', status: 'In Progress', eta: 'Est: 30 minutes' };
        }
        return m;
      })
    );
  };

  // Interactive action: Complete rescue mission
  const handleCompleteMission = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          addLog(`SUCCESS: Mission completed! "${m.title}" logged.`, 'success');
          playBeep(1100, 'sine', 0.2);
          return { ...m, status: 'Completed', eta: 'Archived Today' };
        }
        return m;
      })
    );
  };

  // Select item from sidebar lists
  const selectItem = (id: string, type: 'colony' | 'mission' | 'report') => {
    playBeep(750, 'sine', 0.05);
    setFocusedId(id);
    setFocusedType(type);
    setShowQuickForm(false);
    setClickCoord(null);
    
    // Find item to log focus
    let name = '';
    if (type === 'colony') name = colonies.find(c => c.id === id)?.name || '';
    if (type === 'mission') name = missions.find(m => m.id === id)?.title || '';
    if (type === 'report') name = reports.find(r => r.id === id)?.catName || '';
    
    addLog(`Sensor lock active on: ${name} (${type.toUpperCase()})`, 'info');
  };

  // Get current focused entity details for display card
  const getFocusedItem = () => {
    if (!focusedId || !focusedType) return null;
    if (focusedType === 'colony') return colonies.find(c => c.id === focusedId);
    if (focusedType === 'mission') return missions.find(m => m.id === focusedId);
    if (focusedType === 'report') return reports.find(r => r.id === focusedId);
    return null;
  };

  const focusedItem = getFocusedItem();

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="realtime-map-portal" className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 select-none">
          {/* Transparent Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/70 backdrop-blur-md"
          />

          {/* Core Command Dashboard Container */}
          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-7xl h-full md:h-[90vh] overflow-hidden rounded-none md:rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-800 text-zinc-100 flex flex-col shadow-2xl"
          >
            {/* ================= COMMAND CENTER SYSTEM HEADER ================= */}
            <div className="px-6 py-4 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-extrabold">LIVE DISPATCH COMMAND PORTAL</h3>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-50 dark:bg-zinc-800 text-zinc-400 tracking-wider font-mono">SECTOR_GPS_ON</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium font-sans mt-0.5">Real-time stray tracking, rescue operations, and automated feeder network.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setColonies(INITIAL_COLONIES);
                    setMissions(INITIAL_MISSIONS);
                    setReports(INITIAL_REPORTS);
                    setFocusedId(null);
                    setFocusedType(null);
                    setClickCoord(null);
                    setShowQuickForm(false);
                    playBeep(400, 'sine', 0.25);
                    addLog('System state factory reset executed.', 'system');
                  }}
                  title="Reset Simulation Data"
                  className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-800 dark:text-white hover:bg-zinc-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-red-500 hover:text-zinc-800 dark:text-white text-zinc-400 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ================= MAIN DASHBOARD BODY GRID ================= */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              
              {/* ----------------- SIDEBAR CONTROLLER (LEFT COLUMN) ----------------- */}
              <div className="w-full lg:w-[420px] bg-zinc-950 border-r border-zinc-800/80 flex flex-col overflow-hidden shrink-0">
                
                {/* Section selection tabs: Colonies, Missions, Reports */}
                <div className="grid grid-cols-3 border-b border-zinc-800 shrink-0">
                  <button
                    onClick={() => { setActiveTab('colonies'); playBeep(); }}
                    className={`py-3 px-2 text-center border-b-2 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'colonies'
                        ? 'border-emerald-500 bg-zinc-900/40 text-emerald-400 font-black'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Colonies <span className="text-[10px] opacity-60">({colonies.length})</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('missions'); playBeep(); }}
                    className={`py-3 px-2 text-center border-b-2 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'missions'
                        ? 'border-amber-500 bg-zinc-900/40 text-amber-400 font-black'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Missions <span className="text-[10px] opacity-60">({missions.filter(m => m.status !== 'Completed').length})</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('reports'); playBeep(); }}
                    className={`py-3 px-2 text-center border-b-2 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'reports'
                        ? 'border-red-500 bg-zinc-900/40 text-red-400 font-black'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Reports <span className="text-[10px] opacity-60">({reports.length})</span>
                  </button>
                </div>

                {/* Dynamic Tab Contents List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                  
                  {/* ====== 1. COLONIES TAB ====== */}
                  {activeTab === 'colonies' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Local Colony Stations</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900">TELEMETRY_ONLINE</span>
                      </div>
                      
                      {colonies.map((colony) => {
                        const isFocused = focusedId === colony.id && focusedType === 'colony';
                        return (
                          <div
                            key={colony.id}
                            onClick={() => selectItem(colony.id, 'colony')}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                              isFocused
                                ? 'bg-white dark:bg-zinc-900 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                                : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="font-heading font-black text-sm text-zinc-200">{colony.name}</h4>
                              <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold tracking-wider uppercase ${
                                colony.status === 'Critical'
                                  ? 'bg-red-950 border border-red-800 text-red-400'
                                  : colony.status === 'Warning'
                                  ? 'bg-amber-950 border border-amber-800 text-amber-400'
                                  : 'bg-emerald-950 border border-emerald-900 text-emerald-400'
                              }`}>
                                {colony.status}
                              </span>
                            </div>
                            
                            <p className="text-xs text-zinc-400 mt-1">{colony.location}</p>
                            
                            {/* Resident Count Badge */}
                            <div className="flex items-center gap-2 mt-3 text-[11px] font-bold text-zinc-300">
                              <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                              <span>Resident Population: {colony.catsCount} Cats</span>
                            </div>

                            {/* Feeder Level Bars */}
                            <div className="mt-4 space-y-2 pt-3 border-t border-zinc-800/60">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                                  <span>AUTOMATED FEED DISPENSER</span>
                                  <span className={colony.foodLevel < 20 ? 'text-red-400 font-extrabold animate-pulse' : 'text-zinc-300'}>
                                    {colony.foodLevel}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-50 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-1000 ${
                                      colony.foodLevel < 20 ? 'bg-red-500' : colony.foodLevel < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`} 
                                    style={{ width: `${colony.foodLevel}%` }}
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                                  <span>WATER WELL SUPPLY</span>
                                  <span className={colony.waterLevel < 20 ? 'text-red-400 font-extrabold animate-pulse' : 'text-zinc-300'}>
                                    {colony.waterLevel}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-50 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-1000 ${
                                      colony.waterLevel < 20 ? 'bg-red-500' : colony.waterLevel < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`} 
                                    style={{ width: `${colony.waterLevel}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Refill Button - ONLY visible on selection or critical */}
                            {(isFocused || colony.status === 'Critical') && (
                              <button
                                onClick={(e) => handleRefillColony(colony.id, e)}
                                className="w-full mt-3.5 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-zinc-950 py-1.5 font-bold uppercase tracking-wider text-[10px] transition-colors"
                              >
                                <Droplets className="h-3.5 w-3.5" /> Refill Feeders & Water Well
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ====== 2. MISSIONS TAB ====== */}
                  {activeTab === 'missions' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Rescue Dispatches</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-900">ACTIVE_RUNS</span>
                      </div>

                      {missions.map((mission) => {
                        const isFocused = focusedId === mission.id && focusedType === 'mission';
                        return (
                          <div
                            key={mission.id}
                            onClick={() => selectItem(mission.id, 'mission')}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                              isFocused
                                ? 'bg-white dark:bg-zinc-900 border-amber-500/50 shadow-md shadow-amber-950/20'
                                : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                                {mission.type}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${
                                mission.urgency === 'High'
                                  ? 'bg-red-500/15 border border-red-900 text-red-400'
                                  : mission.urgency === 'Medium'
                                  ? 'bg-amber-500/15 border border-amber-900 text-amber-400'
                                  : 'bg-zinc-50 dark:bg-zinc-800 border border-zinc-700 text-zinc-400'
                              }`}>
                                {mission.urgency} Urgency
                              </span>
                            </div>

                            <h4 className="font-heading font-black text-sm text-zinc-200 mt-1">{mission.title}</h4>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{mission.description}</p>

                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/60 text-[11px]">
                              <div className="flex items-center gap-1.5 text-zinc-400">
                                <User className="h-3 w-3" />
                                <span>{mission.assignedTo ? `Assigned: ${mission.assignedTo}` : 'Unassigned Feral Dispatch'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-amber-400 font-mono text-[10px]">
                                <Clock className="h-3 w-3" />
                                <span>{mission.eta}</span>
                              </div>
                            </div>

                            {/* Action Row */}
                            {isFocused && (
                              <div className="flex gap-2 mt-3">
                                {mission.status === 'Pending' && (
                                  <button
                                    onClick={(e) => handleClaimMission(mission.id, e)}
                                    className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 py-1.5 font-bold uppercase tracking-wider text-[10px] transition-colors"
                                  >
                                    Accept Dispatch Mission
                                  </button>
                                )}
                                {mission.status === 'In Progress' && (
                                  <button
                                    onClick={(e) => handleCompleteMission(mission.id, e)}
                                    className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-zinc-950 py-1.5 font-bold uppercase tracking-wider text-[10px] transition-colors"
                                  >
                                    Complete Dispatch Mission
                                  </button>
                                )}
                                {mission.status === 'Completed' && (
                                  <span className="flex-1 py-1 px-2 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-700 text-zinc-400 text-center font-mono text-[10px]">
                                    Mission Archived & Logged
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ====== 3. REPORTS TAB ====== */}
                  {activeTab === 'reports' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Live Sighting Logs</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-900">COMMUNITY_PINGS</span>
                      </div>

                      {reports.map((report) => {
                        const isFocused = focusedId === report.id && focusedType === 'report';
                        return (
                          <div
                            key={report.id}
                            onClick={() => selectItem(report.id, 'report')}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                              isFocused
                                ? 'bg-white dark:bg-zinc-900 border-red-500/50 shadow-md shadow-red-950/20'
                                : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="h-12 w-12 rounded-lg overflow-hidden border border-zinc-800 shrink-0 bg-zinc-950">
                                <img src={report.image} alt="Report preview" className="h-full w-full object-cover" />
                              </div>
                              <div className="flex-1 space-y-0.5">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-heading font-black text-xs text-zinc-200">{report.catName}</h4>
                                  <span className={`px-1 rounded text-[8px] font-bold tracking-wide uppercase ${
                                    report.status === 'Pending Action'
                                      ? 'bg-red-500/20 text-red-400'
                                      : report.status === 'Dispatched'
                                      ? 'bg-amber-500/20 text-amber-400'
                                      : 'bg-emerald-500/20 text-emerald-400'
                                  }`}>
                                    {report.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-400 line-clamp-2">{report.description}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-500">
                              <span>By: {report.reporter}</span>
                              <span>{report.time}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

                {/* Simulated live console ticker logs */}
                <div className="h-32 bg-zinc-950 border-t border-zinc-800 p-3 flex flex-col justify-between overflow-hidden shrink-0">
                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 border-b border-zinc-900 pb-1.5">
                    <span>LIVE EVENTS FEEDBACK TICKER</span>
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <div className="flex-1 overflow-y-auto font-mono text-[9px] text-emerald-500 space-y-1 mt-1.5 scroll-smooth no-scrollbar">
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-2">
                        <span className="text-zinc-600">[{log.time}]</span>
                        <span className={`font-semibold ${
                          log.type === 'alert' ? 'text-red-400 font-bold' : 
                          log.type === 'success' ? 'text-emerald-400' : 
                          log.type === 'system' ? 'text-blue-400' : 'text-zinc-400'
                        }`}>
                          {log.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* ----------------- INTERACTIVE VECTOR MAP CANVAS (RIGHT) ----------------- */}
              <div className="flex-1 h-full relative bg-zinc-950 flex flex-col justify-between overflow-hidden">
                
                {/* Sector Navigation Title */}
                <div className="absolute top-4 left-4 z-30 rounded-xl bg-zinc-900/90 border border-zinc-800 px-3 py-2 shadow-lg flex items-center gap-2.5 backdrop-blur-md">
                  <Navigation className="h-3.5 w-3.5 text-emerald-400 fill-emerald-500/10 rotate-45 animate-pulse" />
                  <div className="text-[11px] font-mono font-bold tracking-wide">
                    DOWNTOWN_SECTOR_GRID_MAP: <span className="text-emerald-400">ONLINE</span>
                  </div>
                </div>

                {/* Instructions panel on top-right */}
                <div className="absolute top-4 right-4 z-30 hidden md:block rounded-xl bg-zinc-900/90 border border-zinc-800 p-2.5 shadow-lg max-w-[200px] backdrop-blur-md text-[10px] text-zinc-400 font-sans leading-relaxed">
                  <span className="font-bold text-zinc-200 block mb-1">💡 Real-time Demo Tip:</span>
                  Click anywhere on the grid map to select live coordinates and submit a local stray cat report instantly!
                </div>

                {/* MAP AREA */}
                <div
                  onClick={handleMapClick}
                  className="w-full h-full relative cursor-crosshair overflow-hidden"
                >
                  {/* High-tech Blueprint SVG Vector Map overlay */}
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      {/* Technical Grid Pattern */}
                      <pattern id="dark-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                        <rect width="60" height="60" fill="none" />
                        <line x1="0" y1="30" x2="60" y2="30" stroke="#1F2937" strokeWidth="1" opacity="0.4" />
                        <line x1="30" y1="0" x2="30" y2="60" stroke="#1F2937" strokeWidth="1" opacity="0.4" />
                        {/* Dot marks */}
                        <circle cx="30" cy="30" r="1.5" fill="#374151" opacity="0.6" />
                      </pattern>
                      
                      {/* Glow filters */}
                      <filter id="emerald-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <filter id="amber-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <filter id="red-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Base Grid */}
                    <rect width="100%" height="100%" fill="url(#dark-grid)" />

                    {/* Neighborhood River */}
                    <path
                      d="M-50,220 C180,260 280,70 580,120 C760,150 880,310 1300,290"
                      fill="none"
                      stroke="#1E3A8A"
                      strokeWidth="56"
                      strokeLinecap="round"
                      opacity="0.3"
                    />
                    <path
                      d="M-50,220 C180,260 280,70 580,120 C760,150 880,310 1300,290"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="12"
                      strokeLinecap="round"
                      opacity="0.45"
                    />

                    {/* Sector / Park Zones */}
                    <rect x="55%" y="55%" width="25%" height="30%" rx="16" fill="#065F46" opacity="0.15" stroke="#047857" strokeWidth="2" strokeDasharray="6,4" />
                    <text x="67%" y="60%" fill="#10B981" fontSize="9" fontFamily="monospace" opacity="0.7">RESERVE_SECTOR_A</text>

                    <rect x="10%" y="15%" width="20%" height="20%" rx="16" fill="#065F46" opacity="0.15" stroke="#047857" strokeWidth="2" strokeDasharray="6,4" />
                    <text x="14%" y="20%" fill="#10B981" fontSize="9" fontFamily="monospace" opacity="0.7">SHELTER_SECTOR_B</text>

                    {/* Diagonal lanes / Streets */}
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#1F2937" strokeWidth="8" opacity="0.8" />
                    <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#1F2937" strokeWidth="8" opacity="0.8" />
                    
                    <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#1F2937" strokeWidth="6" opacity="0.6" />
                    <line x1="0" y1="80%" x2="100%" y2="80%" stroke="#1F2937" strokeWidth="6" opacity="0.6" />

                    {/* High-tech Coordinate Overlay */}
                    <text x="32%" y="47%" fill="#374151" fontSize="8" fontFamily="monospace">STREET_CROSS_1</text>
                    <text x="77%" y="77%" fill="#374151" fontSize="8" fontFamily="monospace">CROSS_AVENUE_C</text>
                  </svg>

                  {/* ================= MAP MARKERS PLACEMENT ================= */}

                  {/* 1. Colonies Markers (Emerald pulsating icons) */}
                  {colonies.map((colony) => {
                    const isFocused = focusedId === colony.id && focusedType === 'colony';
                    return (
                      <motion.button
                        key={colony.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectItem(colony.id, 'colony');
                        }}
                        style={{ top: `${colony.lat}%`, left: `${colony.lng}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group focus:outline-none"
                        whileHover={{ scale: 1.2 }}
                      >
                        <div className="relative">
                          {/* Pulsing ring for alerts / selection */}
                          {(colony.status === 'Critical' || isFocused) && (
                            <span className="absolute -inset-3.5 rounded-full bg-emerald-500/35 animate-ping" />
                          )}
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center border-2 shadow-lg transition-all ${
                              isFocused
                                ? 'bg-white dark:bg-zinc-900 border-emerald-400 text-emerald-400 scale-110 ring-4 ring-emerald-500/20'
                                : 'bg-zinc-950 border-emerald-600 text-emerald-500 hover:border-emerald-400 hover:text-emerald-400'
                            }`}
                            style={{ filter: 'url(#emerald-glow)' }}
                          >
                            <Navigation className="h-4 w-4 fill-current rotate-45" />
                          </div>
                          
                          {/* Mini resident label overlay */}
                          <span className="absolute left-1/2 -translate-x-1/2 -bottom-5 px-1 bg-zinc-950/90 border border-zinc-800 rounded font-mono text-[8px] text-emerald-400 whitespace-nowrap">
                            CAT_C: {colony.catsCount}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}

                  {/* 2. Rescue Missions Markers (Amber icons) */}
                  {missions.map((mission) => {
                    const isFocused = focusedId === mission.id && focusedType === 'mission';
                    if (mission.status === 'Completed') return null; // hide completed
                    return (
                      <motion.button
                        key={mission.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectItem(mission.id, 'mission');
                        }}
                        style={{ top: `${mission.lat}%`, left: `${mission.lng}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group focus:outline-none"
                        whileHover={{ scale: 1.2 }}
                      >
                        <div className="relative">
                          {(mission.urgency === 'High' || isFocused) && (
                            <span className="absolute -inset-3.5 rounded-full bg-amber-500/35 animate-ping" />
                          )}
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center border-2 shadow-lg transition-all ${
                              isFocused
                                ? 'bg-white dark:bg-zinc-900 border-amber-400 text-amber-400 scale-110 ring-4 ring-amber-500/20'
                                : 'bg-zinc-950 border-amber-600 text-amber-500 hover:border-amber-400 hover:text-amber-400'
                            }`}
                            style={{ filter: 'url(#amber-glow)' }}
                          >
                            <Star className="h-4 w-4 fill-current" />
                          </div>
                          <span className="absolute left-1/2 -translate-x-1/2 -bottom-5 px-1 bg-zinc-950/90 border border-zinc-800 rounded font-mono text-[8px] text-amber-400 whitespace-nowrap">
                            MISSION
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}

                  {/* 3. Community Sighting Reports Markers (Red icons) */}
                  {reports.map((report) => {
                    const isFocused = focusedId === report.id && focusedType === 'report';
                    return (
                      <motion.button
                        key={report.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectItem(report.id, 'report');
                        }}
                        style={{ top: `${report.lat}%`, left: `${report.lng}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group focus:outline-none"
                        whileHover={{ scale: 1.2 }}
                      >
                        <div className="relative">
                          {(report.status === 'Pending Action' || isFocused) && (
                            <span className="absolute -inset-3.5 rounded-full bg-red-500/35 animate-ping" />
                          )}
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center border-2 shadow-lg transition-all ${
                              isFocused
                                ? 'bg-white dark:bg-zinc-900 border-red-400 text-red-400 scale-110 ring-4 ring-red-500/20'
                                : 'bg-zinc-950 border-red-600 text-red-500 hover:border-red-400 hover:text-red-400'
                            }`}
                            style={{ filter: 'url(#red-glow)' }}
                          >
                            <Eye className="h-4 w-4" />
                          </div>
                          <span className="absolute left-1/2 -translate-x-1/2 -bottom-5 px-1 bg-zinc-950/90 border border-zinc-800 rounded font-mono text-[8px] text-red-400 whitespace-nowrap">
                            SIGHTING
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}

                  {/* 4. Active Temporary Click coordinates pin */}
                  {clickCoord && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{ top: `${clickCoord.lat}%`, left: `${clickCoord.lng}%` }}
                      className="absolute -translate-x-1/2 -translate-y-11 z-30 flex flex-col items-center pointer-events-none"
                    >
                      <div className="bg-emerald-500 text-zinc-950 text-[10px] font-mono font-black px-2 py-1 rounded-md shadow-lg whitespace-nowrap flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-zinc-950 fill-zinc-950" /> [L: {clickCoord.lat.toFixed(0)}, {clickCoord.lng.toFixed(0)}]
                      </div>
                      <div className="w-2 h-2 bg-emerald-500 rotate-45 -mt-1" />
                      <div className="h-4 w-4 rounded-full border-2 border-emerald-400 bg-white dark:bg-zinc-900 shadow-md animate-bounce mt-1" />
                    </motion.div>
                  )}

                </div>

                {/* ================= CONTEXT DETAIL DIALOGS / POPUPS AT BOTTOM ================= */}
                <AnimatePresence>
                  
                  {/* Option A: Detailed focused item summary */}
                  {focusedItem && !showQuickForm && (
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      className="absolute bottom-4 left-4 right-4 z-40 bg-white/95 dark:bg-zinc-900/95 border border-zinc-800 rounded-2xl p-5 shadow-2xl backdrop-blur-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded font-mono text-[8px] font-black tracking-wider uppercase ${
                            focusedType === 'colony' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                            focusedType === 'mission' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                            'bg-red-950 text-red-400 border border-red-900'
                          }`}>
                            {focusedType}
                          </span>
                          
                          {focusedType === 'colony' && (
                            <span className="text-[10px] font-mono text-zinc-400">Caretaker: {(focusedItem as Colony).caretaker}</span>
                          )}
                          {focusedType === 'mission' && (
                            <span className="text-[10px] font-mono text-zinc-400">Urgency: {(focusedItem as Mission).urgency}</span>
                          )}
                          {focusedType === 'report' && (
                            <span className="text-[10px] font-mono text-zinc-400">Reporter: {(focusedItem as StateReport).reporter}</span>
                          )}
                        </div>

                        <h4 className="font-heading font-black text-zinc-100 text-sm md:text-base">
                          {focusedType === 'colony' ? (focusedItem as Colony).name :
                           focusedType === 'mission' ? (focusedItem as Mission).title :
                           (focusedItem as StateReport).catName}
                        </h4>

                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {focusedType === 'colony' ? `Currently accommodates ${(focusedItem as Colony).catsCount} rescue cats in ${(focusedItem as Colony).location}. Automatic feeding sensors initialized.` :
                           focusedType === 'mission' ? `Mission parameters: ${(focusedItem as Mission).description} ETA schedule: ${(focusedItem as Mission).eta}.` :
                           `Community report logged: ${(focusedItem as StateReport).description} reported ${(focusedItem as StateReport).time}.`}
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                        {focusedType === 'colony' && (
                          <button
                            onClick={(e) => handleRefillColony(focusedItem.id, e)}
                            className="flex-1 sm:flex-initial rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            Refill Station
                          </button>
                        )}
                        
                        {focusedType === 'mission' && (focusedItem as Mission).status === 'Pending' && (
                          <button
                            onClick={(e) => handleClaimMission(focusedItem.id, e)}
                            className="flex-1 sm:flex-initial rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            Claim Mission
                          </button>
                        )}

                        {focusedType === 'mission' && (focusedItem as Mission).status === 'In Progress' && (
                          <button
                            onClick={(e) => handleCompleteMission(focusedItem.id, e)}
                            className="flex-1 sm:flex-initial rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            Mark Completed
                          </button>
                        )}

                        <button
                          onClick={() => { setFocusedId(null); setFocusedType(null); }}
                          className="flex-1 sm:flex-initial rounded-xl border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-800 dark:text-white hover:bg-zinc-50 dark:bg-zinc-800 transition-all cursor-pointer"
                        >
                          Dismiss Locks
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Option B: Quick Report form overlay when user clicks grid */}
                  {showQuickForm && clickCoord && (
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      className="absolute bottom-4 left-4 right-4 z-40 bg-white dark:bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl max-w-lg mx-auto backdrop-blur-sm"
                    >
                      <form onSubmit={handleSubmitQuickReport} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <div className="flex items-center gap-1.5 text-red-400">
                            <Plus className="h-4 w-4" />
                            <h4 className="font-heading font-black text-xs uppercase tracking-widest">Sighting submission draft</h4>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">LAT: {clickCoord.lat.toFixed(1)}% LNG: {clickCoord.lng.toFixed(1)}%</span>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Cat Name / Identifier</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Scruffy Ginger Tabby"
                              value={newCatName}
                              onChange={(e) => setNewCatName(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-red-500 font-sans"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Observation Notes</label>
                            <textarea
                              rows={2}
                              placeholder="Describe injury status, friendliness, or exact spot details..."
                              value={newCatDesc}
                              onChange={(e) => setNewCatDesc(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-red-500 font-sans resize-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => { setShowQuickForm(false); setClickCoord(null); }}
                            className="px-4 py-2 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-zinc-800 dark:text-white hover:bg-zinc-50 dark:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-zinc-950 font-extrabold uppercase tracking-widest text-[10px] transition-colors"
                          >
                            Log Sighting S.O.S.
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                </AnimatePresence>

              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
