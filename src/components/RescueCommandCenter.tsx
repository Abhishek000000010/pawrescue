import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, MapPin, Eye, Bell, Star, Navigation, Info, Layers, 
  CheckCircle2, AlertTriangle, Plus, Droplets, User, Check, 
  Activity, Clock, RotateCcw, Sparkles, ShieldAlert, Heart,
  Flame, HeartHandshake, DollarSign, TrendingUp, Users, ChevronDown,
  ChevronUp, Search, Stethoscope, Home, Utensils, HelpCircle, Share2, Phone,
  Compass, Maximize2, Sparkle
} from 'lucide-react';
import L from 'leaflet';
import { io } from 'socket.io-client';

// Interfaces for our types
interface RescueMarker {
  id: string;
  type: 'Emergency' | 'Rescue Needed' | 'Adoption' | 'Shelter' | 'Vet' | 'Feeding Station' | 'Water Station' | 'Volunteer' | 'Colony';
  name: string;
  status: string;
  distance: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  lat: number;
  lng: number;
  image: string;
  reportedBy: string;
  reportedTime: string;
  aiAnalysis: string[];
  filterCategory: 'emergency' | 'injured' | 'pregnant' | 'kittens' | 'sick' | 'foster' | 'adoption' | 'vet' | 'shelter' | 'cat_shop';
}

interface TimelineEvent {
  id: string;
  type: 'rescue' | 'mission' | 'adoption' | 'volunteer' | 'donation';
  badge: string;
  badgeBg: string;
  badgeText: string;
  title: string;
  description: string;
  time: string;
  image?: string;
  isAvatar?: boolean;
}

// Distance computation using the Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
}

// Dynamic generator disabled to display only real-time shops and markers
const generateNearbyData = (centerLat: number, centerLng: number, neighborhood = 'Local'): RescueMarker[] => {
  return [];
};

// Function to fetch REAL vets, shelters, and pet shops using the backend places proxy
const fetchRealVetsAndShelters = async (centerLat: number, centerLng: number): Promise<RescueMarker[]> => {
  try {
    const res = await fetch(`/api/cats/map/places?lat=${centerLat}&lng=${centerLng}`);
    if (res.ok) {
      const data = await res.json();
      return data.places || [];
    }
  } catch (err) {
    console.error("Failed to fetch nearby places from backend proxy:", err);
  }
  return [];
};

// Fetch REAL, opted-in foster homes registered by our own Guardians.
// The backend only returns approximate coordinates (privacy), never exact homes.
const fetchNearbyFosters = async (centerLat: number, centerLng: number): Promise<RescueMarker[]> => {
  try {
    const res = await fetch(`/api/auth/fosters?lat=${centerLat}&lng=${centerLng}&radius=25`);
    if (!res.ok) return [];
    const data = await res.json();
    const fosters = data.fosters || [];

    return fosters
      .filter((f: any) => typeof f.approxLat === 'number' && typeof f.approxLng === 'number')
      .map((f: any) => ({
        id: `foster-${f.id}`,
        type: 'Shelter' as const,
        name: `${f.firstName}'s Foster Home`,
        status: `Foster space available • ${f.area}`,
        distance: f.distance != null ? `${f.distance} km` : '—',
        priority: 'Low' as const,
        lat: f.approxLat,
        lng: f.approxLng,
        image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&q=80&w=600',
        reportedBy: 'Registered PawNet Guardian',
        reportedTime: f.availability ? `Available ~${f.availability} hrs/week` : 'Community foster',
        aiAnalysis: [
          'Verified PawNet Guardian',
          'Approximate area shown for privacy',
          'Contact coordinated through PawNet',
        ],
        filterCategory: 'shelter' as const,
      }));
  } catch (err) {
    console.error('Foster fetch error:', err);
    return [];
  }
};

// Initial Events Feed List
const INITIAL_TIMELINE: TimelineEvent[] = [];

// Helper to render customized Leaflet Pin Icons
const getPinIconHtml = (type: string, isSelected: boolean) => {
  const colors: Record<string, string> = {
    'Emergency': 'bg-red-500 border-red-100 text-zinc-800 dark:text-white shadow-red-500/40',
    'Rescue Needed': 'bg-amber-500 border-amber-100 text-zinc-800 dark:text-white shadow-amber-500/40',
    'Adoption': 'bg-emerald-500 border-emerald-100 text-zinc-800 dark:text-white shadow-emerald-500/40',
    'Shelter': 'bg-blue-500 border-blue-100 text-zinc-800 dark:text-white shadow-blue-500/40',
    'Vet': 'bg-purple-500 border-purple-100 text-zinc-800 dark:text-white shadow-purple-500/40',
    'Feeding Station': 'bg-yellow-500 border-yellow-100 text-zinc-800 dark:text-white shadow-yellow-500/40',
    'Water Station': 'bg-sky-500 border-sky-100 text-zinc-800 dark:text-white shadow-sky-500/40',
    'Volunteer': 'bg-emerald-600 border-emerald-200 text-zinc-800 dark:text-white shadow-emerald-600/40',
    'Colony': 'bg-zinc-500 border-zinc-100 text-zinc-800 dark:text-white shadow-zinc-500/40'
  };

  const svgs: Record<string, string> = {
    'Emergency': `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    'Rescue Needed': `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
    'Adoption': `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    'Shelter': `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
    'Vet': `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>`,
    'Feeding Station': `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    'Water Station': `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-1.5m-11.5 0H3m13-4h.01M17 11h.01M17 13h.01"/></svg>`,
    'Volunteer': `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
    'Colony': `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`
  };

  const bgClass = colors[type] || 'bg-zinc-500 text-zinc-800 dark:text-white';
  const svgIcon = svgs[type] || svgs['Rescue Needed'];

  return `
    <div class="relative flex items-center justify-center">
      ${type === 'Emergency' ? `<div class="absolute -inset-2.5 rounded-full bg-red-500/25 animate-ping"></div>` : ''}
      ${isSelected ? `<div class="absolute -inset-3.5 rounded-full bg-brand-primary/25 animate-pulse"></div>` : ''}
      <div class="h-9 w-9 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${bgClass} transition-all duration-200 transform hover:scale-110">
        ${svgIcon}
      </div>
      <div class="absolute -bottom-1 h-2 w-2 rotate-45 border-r border-b border-white shadow-sm ${bgClass.split(' ')[0]}"></div>
    </div>
  `;
};

export default function RescueCommandCenter() {
  // Mode selection & state tracking
  const [isHeatmap, setIsHeatmap] = useState(false);
  const [isVolunteerMode, setIsVolunteerMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationSearch, setLocationSearch] = useState('');

  // Dropdowns for sidebar
  const [collapseFilters, setCollapseFilters] = useState(false);
  const [collapseResources, setCollapseResources] = useState(false);

  // Filters and Marker selection
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<RescueMarker | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('Loading address...');

  useEffect(() => {
    if (selectedMarker) {
      setSelectedAddress('Loading address...');
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedMarker.lat}&lon=${selectedMarker.lng}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            setSelectedAddress(data.display_name);
          } else {
            setSelectedAddress('Address not found');
          }
        })
        .catch(() => setSelectedAddress('Failed to load address'));
    }
  }, [selectedMarker]);

  // Coordinates and Live GPS discovery
  const [userCoords, setUserCoords] = useState<[number, number]>([28.6139, 77.2090]); // Delhi fallback default
  const [centerCoords, setCenterCoords] = useState<[number, number]>([28.6139, 77.2090]);
  const [locationName, setLocationName] = useState<string>('Delhi Sector 4 (Default)');
  const [isLocating, setIsLocating] = useState(false);

  // Custom Report Pin Placement Coords
  const [customReportCoords, setCustomReportCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [customCatName, setCustomCatName] = useState('');
  const [customCatPriority, setCustomCatPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');

  // Animation status and dynamically generated lists
  const [volunteerAccepted, setVolunteerAccepted] = useState(false);
  const [volunteerCoords, setVolunteerCoords] = useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.2090 });
  const [markers, setMarkers] = useState<RescueMarker[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(INITIAL_TIMELINE);

  // Leaflet map refs
  const mapContainerId = "leaflet-map-element";
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const heatmapGroupRef = useRef<L.LayerGroup | null>(null);

  // Monitor Dark Theme Changes directly via element classes
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    setIsDarkTheme(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Play audio response beeps
  const playBeep = (freq = 800, type: OscillatorType = 'sine', dur = 0.08) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (_) {}
  };

  // Filter count helper
  const getFilterCategoryCount = (cat: string) => {
    return markers.filter(m => m.filterCategory === cat).length;
  };

  // Toggle filtering state
  const toggleFilter = (catKey: string) => {
    playBeep(700);
    setActiveFilters(prev => 
      prev.includes(catKey) ? prev.filter(k => k !== catKey) : [...prev, catKey]
    );
  };

  // Standard markers search & category filtering
  const visibleMarkers = markers.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.status.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeFilters.length === 0 || activeFilters.includes(m.filterCategory);
    
    return matchesSearch && matchesCategory;
  });

  // Calculate resources dynamically based on actual nearest generated markers
  const dynamicResources = useMemo(() => {
    const categories: { name: string; type: RescueMarker['type']; icon: string; defaultStatus: string }[] = [
      { name: 'Shelters & Fosters', type: 'Shelter', icon: 'Home', defaultStatus: 'Sanctuary Open' },
      { name: 'Vet Clinics', type: 'Vet', icon: 'Stethoscope', defaultStatus: 'Emergency Open' },
      { name: 'Feeding Stations', type: 'Feeding Station', icon: 'Feeding Station', defaultStatus: 'Dispenser Operational' },
      { name: 'Water Stations', type: 'Water Station', icon: 'Water Station', defaultStatus: 'Clean Water Flow Normal' },
      { name: 'Volunteers Online', type: 'Volunteer', icon: 'Users', defaultStatus: 'Rescuers Active' }
    ];

    return categories.map((cat, index) => {
      const match = markers.filter(m => m.type === cat.type);
      const sorted = [...match].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
      const closest = sorted[0];

      return {
        id: `dynamic-res-${index}`,
        name: cat.name,
        type: cat.type,
        distance: closest ? closest.distance : '0.42 km',
        status: closest ? closest.status : cat.defaultStatus,
        rawMarker: closest || null
      };
    });
  }, [markers]);

  // Calculate 4+ Star rated resources to show in dedicated list (satisfies "four stars near me" and weight)
  const topRatedResources = useMemo(() => {
    return markers.filter(m => {
      const isVetOrShelter = m.type === 'Vet' || m.type === 'Shelter';
      if (!isVetOrShelter) return false;
      const ratingMatch = m.status.match(/(\d\.\d)\s*★/);
      if (ratingMatch) {
        const r = parseFloat(ratingMatch[1]);
        return r >= 4.0;
      }
      return false;
    }).sort((a, b) => {
      const rA = parseFloat(a.status.match(/(\d\.\d)\s*★/)?.[1] || '0');
      const rB = parseFloat(b.status.match(/(\d\.\d)\s*★/)?.[1] || '0');
      return rB - rA;
    });
  }, [markers]);

  // Find user geolocation on mount
  useEffect(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords([lat, lng]);
          setCenterCoords([lat, lng]);
          setVolunteerCoords({ lat, lng });
          setIsLocating(false);
          playBeep(1100, 'sine', 0.2);
        },
        (err) => {
          console.warn("Geolocation permission error or timeout. Using Delhi default.", err);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  // Dynamic reverse-geocoding of neighborhood name
  useEffect(() => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${centerCoords[0]}&lon=${centerCoords[1]}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
          const addr = data.address;
          const label = addr.suburb || addr.neighbourhood || addr.city_district || addr.residential || addr.road || addr.city || addr.town || 'Your Neighborhood';
          setLocationName(label);
        }
      })
      .catch(() => {});
  }, [centerCoords]);

  // Fetch actual markers and connect sockets
  useEffect(() => {
    let isActive = true;
    const fetchCatsAndGenerateMarkers = async () => {
      let realCatMarkers: RescueMarker[] = [];
      try {
        const response = await fetch('/api/cats');
        if (response.ok) {
          const data = await response.json();
          const actualCats = data.cats || [];
          realCatMarkers = actualCats.map((cat: any) => {
            // Add a tiny random jitter (~10-20 meters) to prevent perfect overlapping of pins from the same location
            const jitterLat = (Math.random() - 0.5) * 0.0004;
            const jitterLng = (Math.random() - 0.5) * 0.0004;
            const baseLat = cat.location?.coordinates?.lat || centerCoords[0];
            const baseLng = cat.location?.coordinates?.lng || centerCoords[1];
            const catDist = calculateDistance(centerCoords[0], centerCoords[1], baseLat, baseLng);

            return {
              id: cat._id,
              type: cat.severity === 'critical' ? 'Emergency' : 'Rescue Needed',
              name: cat.name || 'Unknown Cat',
              status: `Reported: ${cat.condition || cat.severity}`,
              distance: `${catDist.toFixed(2)} km`,
              priority: cat.severity === 'critical' ? 'Critical' : cat.severity === 'moderate' ? 'High' : 'Medium',
              lat: baseLat + jitterLat,
              lng: baseLng + jitterLng,
              image: cat.photos?.[0] || 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&q=80&w=600',
              reportedBy: 'Live Reporter',
              reportedTime: new Date(cat.createdAt).toLocaleTimeString(),
              aiAnalysis: [cat.aiSeverityReason || 'Pending analysis'],
              filterCategory: cat.severity === 'critical' ? 'emergency' : 'injured'
            };
          });
        }
      } catch (err) {
        console.error('Failed to fetch real cats for map', err);
      }

      // Geocode center coordinates to get localized name for mock fallback markers
      let localizedName = 'Local';
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${centerCoords[0]}&lon=${centerCoords[1]}`);
        const geoData = await geoRes.json();
        if (geoData && geoData.address) {
          const addr = geoData.address;
          localizedName = addr.suburb || addr.neighbourhood || addr.city_district || addr.residential || addr.road || addr.city || addr.town || 'Local';
        }
      } catch (e) {
        console.warn('Fallback geocode failed:', e);
      }

      // Initialize map immediately with reported cats and locally generated fallbacks
      const fallbackData = generateNearbyData(centerCoords[0], centerCoords[1], localizedName);
      const initialMarkers = [...realCatMarkers, ...fallbackData];

      if (isActive) {
        setMarkers(initialMarkers);
        if (initialMarkers.length > 0) {
          setSelectedMarker(initialMarkers[0]); // Select first element as default
        }
      }

      // Fetch fosters asynchronously from DB next
      try {
        const realFosters = await fetchNearbyFosters(centerCoords[0], centerCoords[1]);
        if (realFosters.length > 0 && isActive) {
          setMarkers(prev => {
            const filtered = prev.filter(m => !m.id.startsWith('foster-'));
            return [...filtered, ...realFosters];
          });
        }
      } catch (err) {
        console.error('Failed to fetch fosters', err);
      }

      // Fetch real OSM resources asynchronously in the background with a 10-second timeout
      try {
        const timeoutPromise = new Promise<RescueMarker[]>((_, reject) =>
          setTimeout(() => reject(new Error('OSM request timeout')), 10000)
        );
        const osmPromise = fetchRealVetsAndShelters(centerCoords[0], centerCoords[1]);
        const realVets = await Promise.race([osmPromise, timeoutPromise]);

        if (realVets.length > 0 && isActive) {
          setMarkers(prev => {
            const filtered = prev.filter(
              m => !m.id.startsWith('vet-fb-') && 
                   !m.id.startsWith('shop-fb-') && 
                   !m.id.startsWith('colony-fb-') && 
                   !m.id.startsWith('osm-') &&
                   !m.id.startsWith('nominatim-')
            );
            return [...filtered, ...realVets];
          });
        }
      } catch (err) {
        console.warn('OSM load failed or timed out. Keeping fallback map data:', err);
      }
    };

    fetchCatsAndGenerateMarkers();

    // Connect to Socket.io for live alerts
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
    socket.on('new_cat_report', (cat: any) => {
      const jitterLat = (Math.random() - 0.5) * 0.0004;
      const jitterLng = (Math.random() - 0.5) * 0.0004;
      
      const newMarker: RescueMarker = {
        id: cat._id,
        type: cat.severity === 'critical' ? 'Emergency' : 'Rescue Needed',
        name: cat.name || 'Unknown Cat',
        status: `Live Report: ${cat.condition || cat.severity}`,
        distance: '0.00 km (Live)',
        priority: cat.severity === 'critical' ? 'Critical' : cat.severity === 'moderate' ? 'High' : 'Medium',
        lat: (cat.location?.coordinates?.lat || centerCoords[0]) + jitterLat,
        lng: (cat.location?.coordinates?.lng || centerCoords[1]) + jitterLng,
        image: cat.photos?.[0] || 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&q=80&w=600',
        reportedBy: 'Live Reporter',
        reportedTime: 'Just Now',
        aiAnalysis: [cat.aiSeverityReason || 'Pending analysis'],
        filterCategory: cat.severity === 'critical' ? 'emergency' : 'injured'
      };

      setMarkers(prev => [newMarker, ...prev]);
      
      setTimelineEvents(prev => [
        {
          id: `evt-live-${Date.now()}`,
          type: 'rescue',
          badge: 'Live SOS Alert',
          badgeBg: 'bg-red-50 dark:bg-red-950/40 text-red-500 border border-red-100',
          badgeText: 'text-red-500',
          title: `New Rescue SOS: ${newMarker.name}`,
          description: cat.location.address || 'Location provided',
          time: 'Just Now',
          image: newMarker.image
        },
        ...prev
      ]);
      playBeep(1200, 'sine', 0.3); // Alert sound!
    });

    return () => {
      isActive = false;
      socket.disconnect();
    };
  }, [centerCoords]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map(mapContainerId, {
      zoomControl: false,
      attributionControl: false
    }).setView(centerCoords, 14);

    mapRef.current = map;

    // Create Layer Groups
    markersGroupRef.current = L.layerGroup().addTo(map);
    heatmapGroupRef.current = L.layerGroup().addTo(map);

    // Map Click Listener
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setCustomReportCoords({ lat, lng });
      setSelectedMarker(null);
      playBeep(900, 'sine', 0.05);
    });

    // Fix empty tile rendering issues by invalidating size after mount
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update center coords on Leaflet map when they resolve
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(centerCoords, 14);
    }
  }, [centerCoords]);

  // Synchronize Map Tiles with Theme Selector
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const tileUrl = isDarkTheme
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const newTiles = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(mapRef.current);

    tileLayerRef.current = newTiles;
  }, [isDarkTheme]);

  // Dynamically update pins and overlays
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current || !heatmapGroupRef.current) return;

    // Clear previous elements
    markersGroupRef.current.clearLayers();
    heatmapGroupRef.current.clearLayers();

    // 1. Plot user coordinate
    if (userCoords) {
      const userHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-3 rounded-full bg-blue-500/25 animate-ping"></div>
          <div class="h-5 w-5 rounded-full border-2 border-white bg-blue-500 shadow-md"></div>
        </div>
      `;
      const userIcon = L.divIcon({
        html: userHtml,
        className: 'custom-user-dot',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker(userCoords, { icon: userIcon })
        .addTo(markersGroupRef.current)
        .bindTooltip('<div class="font-bold text-[10px] uppercase font-sans tracking-wide">My Location</div>', { direction: 'top', offset: [0, -10] });
    }

    // 2. Plot custom Report Pin
    if (customReportCoords) {
      const pinNewHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-3 rounded-full bg-amber-500/35 animate-pulse"></div>
          <div class="h-9 w-9 rounded-full border-2 border-white bg-amber-500 shadow-lg flex items-center justify-center text-zinc-800 dark:text-white">
            <svg class="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div class="absolute -bottom-1 h-2 w-2 rotate-45 border-r border-b border-white shadow bg-amber-500"></div>
        </div>
      `;
      const customIcon = L.divIcon({
        html: pinNewHtml,
        className: 'custom-pin-new',
        iconSize: [36, 42],
        iconAnchor: [18, 42]
      });

      L.marker([customReportCoords.lat, customReportCoords.lng], { icon: customIcon })
        .addTo(markersGroupRef.current);
    }

    // 3. Plot standard rescue markers / heatmaps
    if (isHeatmap) {
      visibleMarkers.forEach((marker) => {
        const radius = marker.priority === 'Critical' ? 600 : marker.priority === 'High' ? 400 : 250;
        const color = marker.priority === 'Critical' ? '#EF4444' : marker.priority === 'High' ? '#F59E0B' : '#EAB308';
        L.circle([marker.lat, marker.lng], {
          radius: radius,
          fillColor: color,
          fillOpacity: 0.35,
          color: color,
          weight: 1.5,
          opacity: 0.5
        }).addTo(heatmapGroupRef.current);
      });
    } else {
      visibleMarkers.forEach((marker) => {
        const isSelected = selectedMarker?.id === marker.id;
        const iconHtml = getPinIconHtml(marker.type, isSelected);
        const markerIcon = L.divIcon({
          html: iconHtml,
          className: `marker-pin-${marker.id}`,
          iconSize: [36, 42],
          iconAnchor: [18, 42]
        });

        const m = L.marker([marker.lat, marker.lng], { icon: markerIcon })
          .addTo(markersGroupRef.current);

        m.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedMarker(marker);
          setCustomReportCoords(null);
          playBeep(950, 'sine', 0.1);
          if (mapRef.current) {
            mapRef.current.panTo([marker.lat, marker.lng]);
          }
        });
      });
    }

    // 4. Plot Active Volunteer dispatch animation
    if (volunteerAccepted && volunteerCoords) {
      const volHtml = `
        <div class="relative flex flex-col items-center justify-center">
          <div class="bg-emerald-500 text-zinc-950 font-mono text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white whitespace-nowrap animate-bounce">
            DISPATCH_GPS
          </div>
          <div class="h-4.5 w-4.5 rounded-full bg-emerald-400 border-2 border-emerald-600 shadow-md"></div>
        </div>
      `;
      const volIcon = L.divIcon({
        html: volHtml,
        className: 'custom-volunteer-tracker',
        iconSize: [80, 40],
        iconAnchor: [40, 40]
      });

      L.marker([volunteerCoords.lat, volunteerCoords.lng], { icon: volIcon })
        .addTo(markersGroupRef.current);
    }

  }, [visibleMarkers, isHeatmap, selectedMarker, customReportCoords, userCoords, volunteerAccepted, volunteerCoords]);

  // Live Volunteer pathing loop simulation
  useEffect(() => {
    if (!volunteerAccepted || !selectedMarker) return;

    const interval = setInterval(() => {
      setVolunteerCoords((curr) => {
        const dLat = selectedMarker.lat - curr.lat;
        const dLng = selectedMarker.lng - curr.lng;
        const distance = Math.sqrt(dLat * dLat + dLng * dLng);

        if (distance < 0.0008) { // Reached target coordinate within ~80 meters
          clearInterval(interval);
          setVolunteerAccepted(false);
          playBeep(1200, 'sine', 0.25);
          
          setTimelineEvents((prev) => [
            {
              id: `evt-comp-${Date.now()}`,
              type: 'mission',
              badge: 'Mission Completed',
              badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100',
              badgeText: 'text-emerald-600 dark:text-emerald-400',
              title: `Rahul P. arrived at ${selectedMarker.name}`,
              description: 'Emergency rescue treatment initiated on site.',
              time: 'Just Now',
              image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
              isAvatar: true
            },
            ...prev
          ]);
          return curr;
        }

        // Stepping route towards pin
        return {
          lat: curr.lat + dLat * 0.18,
          lng: curr.lng + dLng * 0.18,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [volunteerAccepted, selectedMarker]);

  // Fly map directly to user's real GPS coordinates
  const handleLocateMe = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords([lat, lng]);
          setCenterCoords([lat, lng]);
          if (mapRef.current) {
            mapRef.current.flyTo([lat, lng], 15);
          }
          setIsLocating(false);
          playBeep(1000, 'sine', 0.15);
        },
        () => {
          setIsLocating(false);
          playBeep(400, 'triangle', 0.1);
        }
      );
    }
  };

  const handleLocationSearch = async () => {
    if (!locationSearch.trim()) return;
    setIsLocating(true);
    setLocationName('Searching...');

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&limit=1`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        setUserCoords([newLat, newLng]);
        setCenterCoords([newLat, newLng]);
        if (mapRef.current) {
          mapRef.current.flyTo([newLat, newLng], 14);
        }
        setLocationName(display_name);
      } else {
        setLocationName('Location not found');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setLocationName('Search failed');
    } finally {
      setIsLocating(false);
    }
  };

  const handleClaimMission = () => {
    if (!selectedMarker) return;
    setVolunteerAccepted(true);
    // Spawn volunteer offset slightly near center point
    setVolunteerCoords({ lat: centerCoords[0] + 0.004, lng: centerCoords[1] - 0.005 });
    playBeep(1000, 'triangle', 0.15);

    const newEvt: TimelineEvent = {
      id: `evt-claim-${Date.now()}`,
      type: 'mission',
      badge: 'Mission In Progress',
      badgeBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200',
      badgeText: 'text-amber-700 dark:text-amber-400',
      title: `You accepted dispatch to "${selectedMarker.name}"`,
      description: 'Navigating to target coordinates...',
      time: 'Just Now',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      isAvatar: true
    };
    setTimelineEvents(prev => [newEvt, ...prev]);
  };

  const handleSubmitCustomReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customReportCoords || !customCatName) return;

    const newM: RescueMarker = {
      id: `C-${Math.floor(1000 + Math.random() * 9000)}`,
      type: customCatPriority === 'Critical' ? 'Emergency' : 'Rescue Needed',
      name: customCatName,
      status: `Community reported: ${customCatName}. Priority level set to ${customCatPriority}.`,
      distance: '0.10 km',
      priority: customCatPriority,
      lat: customReportCoords.lat,
      lng: customReportCoords.lng,
      image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&q=80&w=600',
      reportedBy: 'You (Rescuer)',
      reportedTime: 'Today, Just Now',
      aiAnalysis: [
        'Stress level high',
        'Physical injury audit required',
        'Coordinate live dispatch'
      ],
      filterCategory: customCatPriority === 'Critical' ? 'emergency' : 'injured'
    };

    setMarkers(prev => [newM, ...prev]);
    setSelectedMarker(newM);
    
    setTimelineEvents(prev => [
      {
        id: `evt-custom-${Date.now()}`,
        type: 'rescue',
        badge: 'Urgent Sighting',
        badgeBg: 'bg-red-50 dark:bg-red-950/40 text-red-500 border border-red-100',
        badgeText: 'text-red-500',
        title: `Sighting reported: ${customCatName}`,
        description: 'Placed via map coordinates.',
        time: 'Just Now',
        image: newM.image
      },
      ...prev
    ]);

    setCustomReportCoords(null);
    setCustomCatName('');
    playBeep(1100, 'sine', 0.2);
  };



  const handleZoomIn = () => {
    playBeep(900);
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    playBeep(800);
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  return (
    <div id="rescue-operations-center" className="relative h-[calc(100vh-80px)] font-sans transition-colors duration-300 overflow-hidden bg-white dark:bg-zinc-950 flex flex-col">
      {/* Background Mesh Gradient (Optional reinforcement for the live center) */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      {/* ================= COMMAND CENTER TOP NAVIGATION & CONTROL BAR ================= */}
      <div className="px-6 w-full mx-auto mb-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        
        {/* Brand / Title Left */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <Heart className="h-5 w-5 fill-current animate-pulse text-brand-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              Paw Rescue <span className="text-xs px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-mono tracking-widest uppercase">Live Center</span>
            </h1>
            <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Live location: <span className="text-brand-primary font-bold">{locationName}</span> [GPS Enabled]
            </p>
          </div>
        </div>

        {/* Floating Search Inputs: Geocoded Location & Marker Filter */}
        <div className="w-full md:max-w-xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/65 dark:border-zinc-800/60 p-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-sm">
          <div className="flex-1 relative border-b sm:border-b-0 sm:border-r border-zinc-200 dark:border-zinc-800">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search location..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLocationSearch();
              }}
              className="w-full rounded-xl border-0 bg-transparent pl-9 pr-2 py-2 text-xs text-zinc-800 dark:text-zinc-100 focus:ring-0 focus:outline-none font-semibold"
            />
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter markers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-0 bg-transparent pl-9 pr-2 py-2 text-xs text-zinc-800 dark:text-zinc-100 focus:ring-0 focus:outline-none font-semibold"
            />
          </div>
          <div className="flex items-center gap-1.5 pl-2 pr-1 pb-1 sm:pb-0 shrink-0">
            <button
              onClick={handleLocationSearch}
              disabled={isLocating}
              className="px-3 py-1.5 rounded-xl bg-brand-primary text-zinc-950 hover:bg-brand-primary/95 transition-all cursor-pointer text-[10px] font-bold disabled:opacity-50"
            >
              Go
            </button>
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-[10px] font-bold text-brand-primary hover:bg-brand-primary/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Compass className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} /> 
              {isLocating ? 'Locating...' : 'Near Me'}
            </button>
          </div>
        </div>

        {/* Right Action Icons & Toggles */}
        <div className="flex items-center gap-4">
          
          {/* Volunteer Mode Switch */}
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-1 border border-zinc-200/50 dark:border-zinc-800/40 flex items-center">
            <button
              onClick={() => { setIsVolunteerMode(false); playBeep(800); }}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                !isVolunteerMode 
                  ? 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-sm' 
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Normal User
            </button>
            <button
              onClick={() => { setIsVolunteerMode(true); playBeep(900); }}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                isVolunteerMode 
                  ? 'bg-brand-primary text-zinc-800 dark:text-white shadow-md' 
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Volunteer
            </button>
          </div>


        </div>
      </div>

      {/* ================= MAIN INTERFACE SCREEN SPLIT ================= */}
      <div className="w-full flex-1 flex flex-col lg:flex-row items-stretch border-t border-zinc-200 dark:border-zinc-800 min-h-0">
        
        {/* ----------------- LEFT SIDEBAR ----------------- */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col overflow-y-auto no-scrollbar border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pb-10">
          
          {/* Section 1: Rescue Filters */}
          <div className="border-b border-zinc-200 dark:border-zinc-800/50">
            <button
              onClick={() => setCollapseFilters(!collapseFilters)}
              className="w-full px-5 py-4 flex items-center justify-between font-black text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              <span className="flex items-center gap-2">🚨 RESCUE FILTERS</span>
              {collapseFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>

            <AnimatePresence initial={false}>
              {!collapseFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-5 pb-5 pt-1 space-y-1.5 border-t border-zinc-100/50 dark:border-zinc-800/20"
                >
                  {[
                    { key: 'emergency', label: 'Emergency Sightings', icon: '🚨', count: 4, bg: 'bg-red-500/10 text-red-500 border-red-500/20' },
                    { key: 'injured', label: 'Injured Felines', icon: '🤕', count: 3, bg: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
                    { key: 'pregnant', label: 'Pregnant Nesting', icon: '🤰', count: 2, bg: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' },
                    { key: 'vet', label: 'Vet Clinics & Shops', icon: '🩺', count: 4, bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
                    { key: 'shelter', label: 'Cat Communities & Shelters', icon: '🏡', count: 3, bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
                    { key: 'cat_shop', label: 'Cat Shops & Supplies', icon: '🛒', count: 5, bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
                  ].map((filter) => {
                    const isSelected = activeFilters.includes(filter.key);
                    return (
                      <button
                        key={filter.key}
                        onClick={() => toggleFilter(filter.key)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? `${filter.bg} font-bold ring-1 ring-offset-1 dark:ring-offset-zinc-950`
                            : 'bg-zinc-50 dark:bg-zinc-900/30 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm leading-none">{filter.icon}</span>
                          <span>{filter.label}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-800 text-[9px] font-black text-zinc-500 dark:text-zinc-400">
                          {getFilterCategoryCount(filter.key)}
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 2: ⭐ Highly Rated Vets & Fosters (4+ Stars near me) */}
          <div className="p-5 space-y-3 border-b border-zinc-200 dark:border-zinc-800/50">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-current text-amber-500 animate-pulse" /> 4+ STAR PARTNERS NEAR ME
            </span>
            <div className="space-y-2 max-h-[190px] overflow-y-auto no-scrollbar">
              {topRatedResources.length > 0 ? (
                topRatedResources.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => {
                      setSelectedMarker(res);
                      if (mapRef.current) {
                        mapRef.current.panTo([res.lat, res.lng]);
                      }
                      playBeep(950, 'sine', 0.1);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center gap-2 ${
                      selectedMarker?.id === res.id 
                        ? 'bg-amber-500/10 border-amber-500/40' 
                        : 'bg-zinc-50 dark:bg-zinc-900/30 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-zinc-800 dark:text-zinc-100 truncate">{res.name}</p>
                      <p className="text-[9px] font-bold text-zinc-400 mt-0.5">{res.type} • {res.distance} away</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-zinc-950 text-[10px] font-black font-mono flex items-center gap-0.5 shrink-0">
                      {res.status.match(/(\d\.\d)\s*★/)?.[1] || '4.8'} <Star className="h-2.5 w-2.5 fill-current" />
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-zinc-400 font-semibold text-center py-2">No 4+ star partners found near coordinates.</p>
              )}
            </div>
          </div>



        </div>

        {/* ----------------- CENTER MAP WORKSPACE ----------------- */}
        <div className="flex-1 flex flex-col h-full relative">
          
          {/* MAP CANVAS PANEL */}
          <div className="flex-1 relative bg-zinc-100 dark:bg-zinc-900 flex flex-col overflow-hidden">
            
            {/* Top-left: Map View vs Heatmap View pill overlay */}
            <div className="absolute top-4 left-4 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-zinc-200/40 dark:border-zinc-800/40 flex items-center">
              <button
                onClick={() => { setIsHeatmap(false); playBeep(); }}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  !isHeatmap 
                    ? 'bg-brand-primary text-zinc-800 dark:text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Map View
              </button>
              <button
                onClick={() => { setIsHeatmap(true); setSelectedMarker(null); playBeep(); }}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isHeatmap 
                    ? 'bg-brand-primary text-zinc-800 dark:text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Heatmap View
              </button>
            </div>

            {/* Top-right map utility controls */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
              <button 
                onClick={handleLocateMe}
                title="Locate Me"
                className="p-2.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <Navigation className="h-4 w-4" />
              </button>
              <button 
                onClick={() => {
                  playBeep(900);
                  if (mapRef.current) {
                    mapRef.current.setView(userCoords, 14);
                  }
                }}
                title="Default Center"
                className="p-2.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <Compass className="h-4 w-4" />
              </button>
            </div>

            {/* REAL LEAFLET STREET MAP CONTAINER */}
            <div id={mapContainerId} className="absolute inset-0 z-10" />

            {/* ================= BOTTOM-LEFT: LIVE TRACKING CONSOLE CARD ================= */}
            {isVolunteerMode && (
              <div 
                className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800/40 shadow-lg w-[260px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black font-mono text-zinc-500 uppercase tracking-wider">Live Rescuer Tracking</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[9px] font-black font-mono uppercase">ON</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden border border-zinc-200">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150" alt="Rescuer Rahul" />
                  </div>
                  <div>
                    <h6 className="text-xs font-black text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                      Rahul P. <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </h6>
                    <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Volunteer Rescuer</p>
                    <p className="text-[10px] text-zinc-500 font-black mt-1">Dispatched near coordinates</p>
                  </div>
                </div>
              </div>
            )}

            {/* ================= BOTTOM-RIGHT: FLOATING MINI LEGEND ================= */}
            <div className="absolute bottom-4 right-4 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl p-4 border border-zinc-200/45 dark:border-zinc-800/40 shadow-lg w-[190px] hidden sm:block">
              <div className="grid grid-cols-1 gap-1.5 text-[10px] font-extrabold text-zinc-600 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Emergency Sighting
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Rescue Needed
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Shelter / Foster
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Vet Partner
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" /> Feeding Station
                </div>
              </div>
              {/* Stacked zoom controls */}
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between gap-1">
                <button onClick={handleZoomIn} className="flex-1 py-1 rounded bg-zinc-100 dark:bg-zinc-800 font-black text-xs hover:bg-zinc-200 cursor-pointer">+</button>
                <button onClick={handleZoomOut} className="flex-1 py-1 rounded bg-zinc-100 dark:bg-zinc-800 font-black text-xs hover:bg-zinc-200 cursor-pointer">-</button>
              </div>
            </div>

            {/* ================= IN-GRID QUICK PLACEMENT REPORT FORM ================= */}
            <AnimatePresence>
              {customReportCoords && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="absolute bottom-4 left-4 right-4 z-40 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xl backdrop-blur-sm flex flex-col md:flex-row justify-between items-center gap-4 animate-in fade-in duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex-1 w-full space-y-1">
                    <span className="text-[10px] font-mono text-brand-primary uppercase font-extrabold block">📌 REGISTER COORDS</span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                      Marker placed at: [Lat: {customReportCoords.lat.toFixed(4)}, Lng: {customReportCoords.lng.toFixed(4)}]
                    </p>
                  </div>
                  <form onSubmit={handleSubmitCustomReport} className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
                    <input
                      type="text"
                      required
                      placeholder="Cat name or Sighting details"
                      value={customCatName}
                      onChange={(e) => setCustomCatName(e.target.value)}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 px-3.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-100 focus:border-brand-primary focus:outline-none font-semibold w-full sm:w-[200px]"
                    />
                    <select
                      value={customCatPriority}
                      onChange={(e) => setCustomCatPriority(e.target.value as any)}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-100 focus:border-brand-primary focus:outline-none font-semibold cursor-pointer"
                    >
                      <option value="Critical">🚨 Critical</option>
                      <option value="High">⚠️ High</option>
                      <option value="Medium">⚡ Medium</option>
                      <option value="Low">💤 Low</option>
                    </select>
                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                      <button
                        type="submit"
                        className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-white px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-brand-primary/10 cursor-pointer"
                      >
                        File Report
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomReportCoords(null)}
                        className="p-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-50 dark:bg-zinc-800 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ----------------- RIGHT FLOATING INFO PANEL (INSIDE MAP CONTAINER) ----------------- */}
            <AnimatePresence mode="wait">
              {selectedMarker && (
                <motion.div
                  key={selectedMarker.id}
                  initial={{ opacity: 0, x: 340 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 340 }}
                  className="absolute top-4 right-4 bottom-4 w-full md:w-[340px] z-[400] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-[20px] border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl overflow-y-auto no-scrollbar flex flex-col"
                >
                {/* Deselect/Close Button */}
                <button
                  onClick={() => { setSelectedMarker(null); playBeep(400); }}
                  className="absolute right-3 top-3 z-30 h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Large Cat Photo Header */}
                <div className="relative aspect-[4/3] w-full bg-zinc-100 overflow-hidden">
                  <img src={selectedMarker.image} alt={selectedMarker.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  {selectedMarker.type === 'Emergency' && (
                    <span className="absolute left-3 top-3 px-2.5 py-1 rounded-md bg-red-500 text-[9px] font-black uppercase tracking-widest text-white">
                      🚨 EMERGENCY SIGHTING
                    </span>
                  )}
                  {selectedMarker.type === 'Vet' && (
                    <span className="absolute left-3 top-3 px-2.5 py-1 rounded-md bg-purple-500 text-[9px] font-black uppercase tracking-widest text-white">
                      🩺 VET PARTNER
                    </span>
                  )}
                  {selectedMarker.type === 'Shelter' && (
                    <span className="absolute left-3 top-3 px-2.5 py-1 rounded-md bg-blue-500 text-[9px] font-black uppercase tracking-widest text-white">
                      🏡 FOSTER SANCTUARY
                    </span>
                  )}
                </div>

                {/* Cat Information Details */}
                <div className="p-5 space-y-4">
                  
                  {/* Title & Code ID */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-heading font-black text-sm text-zinc-800 dark:text-zinc-50 leading-none">
                        {selectedMarker.name}
                      </h3>
                      <span className="text-[10px] font-mono font-black text-zinc-400 mt-1 block">#{selectedMarker.id.split('-')[0].toUpperCase()}</span>
                    </div>
                    {selectedMarker.status.includes('★') ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 font-mono text-[10px] font-black tracking-wider uppercase flex items-center gap-0.5 shrink-0">
                        {selectedMarker.status.match(/(\d\.\d)\s*★/)?.[1] || '4.8'} <Star className="h-3 w-3 fill-current" />
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-mono text-[9px] font-black tracking-wider uppercase">
                        {selectedMarker.priority} Priority
                      </span>
                    )}
                  </div>

                  {/* Icon details rows */}
                  <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-zinc-400 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Location Status</span>
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{selectedMarker.status.split('•')[0]}</p>
                        <span className="text-[9px] font-semibold text-brand-primary mt-0.5 block">{selectedMarker.distance} away from center</span>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed max-w-[200px]">{selectedAddress}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <User className="h-4 w-4 text-zinc-400 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Registrar</span>
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{selectedMarker.reportedBy}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Clock className="h-4 w-4 text-zinc-400 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Observation Period</span>
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{selectedMarker.reportedTime}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Triage Analysis */}
                  <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100/60 dark:border-zinc-800/60 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-black text-brand-primary uppercase tracking-wider">
                      <Sparkles className="h-3.5 w-3.5" /> TELEMETRY & CHANNELS
                    </div>
                    <ul className="space-y-1 pl-1 list-disc list-inside text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
                      {selectedMarker.aiAnalysis.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Claim/Accept mission logic */}
                  {selectedMarker.type !== 'Vet' && selectedMarker.type !== 'Shelter' && selectedMarker.type !== 'Feeding Station' && selectedMarker.type !== 'Water Station' && (
                    volunteerAccepted ? (
                      <div className="w-full text-center py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Mission Dispatched
                      </div>
                    ) : (
                      <button
                        onClick={handleClaimMission}
                        className="w-full py-3.5 rounded-2xl bg-brand-primary hover:bg-brand-primary-hover text-white font-black uppercase tracking-wider text-[11px] shadow-md shadow-brand-primary/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Navigation className="h-4 w-4 fill-current rotate-45" /> Dispatch Help
                      </button>
                    )
                  )}

                  {/* Row of minor actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button 
                      onClick={() => {
                        playBeep(1000);
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedMarker.name)}+${selectedMarker.lat},${selectedMarker.lng}`, '_blank');
                      }}
                      className="py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-brand-primary font-black uppercase tracking-wider text-[9px] hover:bg-brand-primary/10 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Navigation className="h-3.5 w-3.5" /> View on Google Maps
                    </button>
                    <button 
                      onClick={() => playBeep(1050)}
                      className="py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 font-black uppercase tracking-wider text-[9px] hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Phone className="h-3.5 w-3.5" /> Contact Partner
                    </button>
                  </div>

                </div>
              </motion.div>
              )}
            </AnimatePresence>
            
          </div>
        </div>

      </div>



    </div>
  );
}
