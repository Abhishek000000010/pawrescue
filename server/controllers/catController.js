import Cat from '../models/Cat.js';
import Mission from '../models/Mission.js';
import { analyzeCatSeverity } from '../services/aiService.js';
import { getIO } from '../services/socketService.js';

/**
 * POST /api/cats
 * Report a new stray cat.
 * Accepts multipart form data with up to 5 images.
 * Runs Gemini AI severity analysis on the first uploaded photo.
 */
export const reportCat = async (req, res) => {
  try {
    const {
      address,
      area,
      city,
      lat,
      lng,
      condition,
      healthStatus,
      colorMarkings,
      estimatedAge,
      behaviors,
      contactName,
      contactPhone,
      tags,
      name,
    } = req.body;

    if (!address || !lat || !lng) {
      return res.status(400).json({ message: 'Location address and coordinates are required.' });
    }

    // Collect uploaded photo URLs from Multer/Cloudinary, or mockPhoto from request body
    const photos = req.files && req.files.length > 0 
      ? req.files.map((f) => f.path) 
      : req.body.mockPhoto 
        ? [req.body.mockPhoto] 
        : [];

    // Run AI severity analysis on the first photo (if available)
    let severity = 'moderate';
    let aiSeverityReason = '';

    if (photos.length > 0) {
      const aiResult = await analyzeCatSeverity(photos[0]);
      severity = aiResult.severity;
      aiSeverityReason = aiResult.reason;
    } else {
      // No photo — derive severity from healthStatus field
      if (healthStatus === 'Injured' || healthStatus === 'Sick') {
        severity = 'critical';
        aiSeverityReason = 'No photo provided. Severity set based on reported health status.';
      } else {
        severity = 'stable';
        aiSeverityReason = 'No photo provided. Defaulting to stable.';
      }
    }

    // Parse behaviors if sent as a JSON string
    let parsedBehaviors = [];
    if (behaviors) {
      try {
        parsedBehaviors = typeof behaviors === 'string' ? JSON.parse(behaviors) : behaviors;
      } catch {
        parsedBehaviors = [behaviors];
      }
    }

    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = [tags];
      }
    }

    const cat = await Cat.create({
      name: name || 'Unnamed Stray',
      photos,
      location: {
        address,
        area: area || '',
        city: city || '',
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
      },
      severity,
      aiSeverityReason,
      condition: condition || '',
      status: 'reported',
      reportedBy: req.user ? req.user._id : null,
      rescueTimeline: [
        {
          status: 'reported',
          note: `Cat reported by ${contactName || 'Anonymous'}. AI severity: ${severity}. ${aiSeverityReason}`,
          updatedBy: req.user ? req.user._id : null,
          timestamp: new Date(),
        },
      ],
      tags: parsedTags,
      healthStatus: healthStatus || 'Healthy',
      colorMarkings: colorMarkings || '',
      estimatedAge: estimatedAge || '',
      behaviors: parsedBehaviors,
      contactName: contactName || '',
      contactPhone: contactPhone || '',
    });

    // Auto-create a mission for urgent/critical cats
    console.log(`Checking auto-mission for severity: ${severity}`);
    if (severity === 'critical' || severity === 'moderate') {
      try {
        console.log('Attempting to create mission for cat:', cat._id);
        const mission = await Mission.create({
          type: 'rescue',
          title: `Urgent Rescue: ${cat.name}`,
          description: `Cat reported at ${address}. Severity: ${severity.toUpperCase()}. AI Notes: ${aiSeverityReason}`,
          cat: cat._id,
          location: cat.location,
          pointsReward: severity === 'critical' ? 50 : 30,
          urgency: severity === 'critical' ? 'urgent' : 'normal',
          createdBy: req.user ? req.user._id : null
        });

        // Broadcast new mission
        const populatedMission = await Mission.findById(mission._id).populate('cat');
        console.log('Mission created successfully:', populatedMission._id);
        try { getIO().emit('new_mission', populatedMission); } catch (e) {
          console.error('Socket emit error for mission:', e);
        }
      } catch (err) {
        console.error('Failed to auto-create mission:', err);
      }
    }

    try {
      await import('../models/Notification.js').then(({ default: Notification }) => {
        Notification.create({
          title: 'New Cat Reported',
          message: `A ${severity} severity cat was reported at ${address}.`,
          type: 'cat_reported'
        });
      });
    } catch (e) {
      console.error('Failed to create notification', e);
    }

    try { getIO().emit('new_cat_report', cat); } catch (e) {
      console.error('Socket emit error for cat:', e);
    }

    res.status(201).json({
      _id: cat._id,
      name: cat.name,
      photos: cat.photos,
      location: cat.location,
      severity: cat.severity,
      aiSeverityReason: cat.aiSeverityReason,
      status: cat.status,
      healthStatus: cat.healthStatus,
      createdAt: cat.createdAt,
    });
  } catch (error) {
    console.error('Report cat error:', error);
    res.status(500).json({ message: 'Server error while reporting cat.', error: error.message });
  }
};

/**
 * GET /api/cats
 * Get all cats with optional filters: city, severity, status
 */
export const getCats = async (req, res) => {
  try {
    const { city, severity, status, limit = 50, page = 1 } = req.query;

    const filter = {};
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (severity) filter.severity = severity;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cats = await Cat.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reportedBy', 'name email avatar')
      .lean();

    const total = await Cat.countDocuments(filter);

    res.json({ cats, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('Get cats error:', error);
    res.status(500).json({ message: 'Server error fetching cats.' });
  }
};

/**
 * GET /api/cats/:id
 * Get single cat with full rescue timeline
 */
export const getCatById = async (req, res) => {
  try {
    const cat = await Cat.findById(req.params.id)
      .populate('reportedBy', 'name email avatar')
      .populate('assignedVolunteer', 'name email avatar')
      .populate('rescueTimeline.updatedBy', 'name');

    if (!cat) {
      return res.status(404).json({ message: 'Cat not found.' });
    }

    res.json(cat);
  } catch (error) {
    console.error('Get cat error:', error);
    res.status(500).json({ message: 'Server error fetching cat details.' });
  }
};

/**
 * GET /api/cats/map/pins
 * Get all cat coordinates for the interactive map
 */
export const getMapPins = async (req, res) => {
  try {
    const cats = await Cat.find({
      status: { $nin: ['adopted', 'deceased'] },
    })
      .select('name location severity status healthStatus photos tags createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const pins = cats.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      lat: cat.location.coordinates.lat,
      lng: cat.location.coordinates.lng,
      address: cat.location.address,
      severity: cat.severity,
      status: cat.status,
      healthStatus: cat.healthStatus,
      photo: cat.photos?.[0] || null,
      tags: cat.tags,
      createdAt: cat.createdAt,
    }));

    res.json(pins);
  } catch (error) {
    console.error('Get map pins error:', error);
    res.status(500).json({ message: 'Server error fetching map pins.' });
  }
};

/**
 * PUT /api/cats/:id/status
 * Update rescue status and add timeline entry
 */
export const updateCatStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const cat = await Cat.findById(req.params.id);

    if (!cat) {
      return res.status(404).json({ message: 'Cat not found.' });
    }

    cat.status = status;
    cat.rescueTimeline.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.user._id,
      timestamp: new Date(),
    });

    if (status === 'ready_for_adoption') {
      cat.isAvailableForAdoption = true;
    }

    await cat.save();
    res.json(cat);
  } catch (error) {
    console.error('Update cat status error:', error);
    res.status(500).json({ message: 'Server error updating cat status.' });
  }
};

/**
 * POST /api/cats/analyze
 * Standalone AI analysis endpoint — analyze an image without creating a cat record.
 * Useful for live AI feedback in the frontend form.
 */
export const analyzeImage = async (req, res) => {
  try {
    console.log('analyzeImage called, files:', req.files);
    const photos = req.files ? req.files.map((f) => f.path) : [];

    if (photos.length === 0) {
      console.log('No photos found in req.files');
      return res.status(400).json({ message: 'No image uploaded for analysis.' });
    }

    console.log('Running AI analysis on:', photos[0]);
    const aiResult = await analyzeCatSeverity(photos[0]);
    console.log('AI result:', aiResult);

    res.json({
      severity: aiResult.severity,
      healthStatus: aiResult.healthStatus,
      reason: aiResult.reason,
      imageUrl: photos[0],
    });
  } catch (error) {
    console.error('Analyze image error:', error);
    res.status(500).json({ message: 'Server error during AI analysis.' });
  }
};

/**
 * GET /api/cats/map/places
 * Public endpoint to fetch nearby vets, shelters, and pet shops.
 * Proxies request to Nominatim/Overpass with custom headers to prevent rate-limiting/CORS blocks.
 */
export const getNearbyPlaces = async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude and Longitude are required.' });
  }

  const centerLat = parseFloat(lat);
  const centerLng = parseFloat(lng);
  if (isNaN(centerLat) || isNaN(centerLng)) {
    return res.status(400).json({ message: 'Invalid latitude or longitude.' });
  }

  // Helper to calculate distance
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const radius = 25000; // 25km search radius for optimal speed and density
  const query = `
    [out:json][timeout:15];
    (
      nwr["amenity"="veterinary"](around:${radius},${centerLat},${centerLng});
      nwr["amenity"="animal_shelter"](around:${radius},${centerLat},${centerLng});
      nwr["shop"="pet"](around:${radius},${centerLat},${centerLng});
    );
    out center;
  `;

  const mirrors = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  try {
    // Query all Overpass API mirrors in parallel. First one to respond wins!
    const data = await Promise.any(
      mirrors.map(async (url) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds max per mirror
        
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'PawRescueApp/1.0 (contact@pawrescue-test.org)',
              'Referer': 'https://pawrescue-test.org/'
            },
            body: `data=${encodeURIComponent(query)}`,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`Mirror ${url} returned ${response.status}`);
          const json = await response.json();
          if (!json || !json.elements || json.elements.length === 0) {
            throw new Error(`Mirror ${url} returned empty elements list`);
          }
          return json;
        } catch (e) {
          clearTimeout(timeoutId);
          throw e;
        }
      })
    );

    const overpassResult = [];
    data.elements.forEach((el, i) => {
      const plat = el.lat || el.center?.lat;
      const plon = el.lon || el.center?.lon;
      if (!plat || !plon) return;

      const isVet = el.tags?.amenity === 'veterinary';
      const isShelter = el.tags?.amenity === 'animal_shelter';
      const isPetShop = el.tags?.shop === 'pet';

      let type = 'Vet';
      let filterCategory = 'vet';
      let name = el.tags?.name || 'Local Vet Clinic';
      let status = '';
      let image = '';
      let desc = '';

      const dist = calculateDistance(centerLat, centerLng, plat, plon);
      const fakeRating = (4.0 + Math.random() * 0.9).toFixed(1);

      if (isVet) {
        type = 'Vet';
        filterCategory = 'vet';
        name = el.tags?.name || 'Local Vet Clinic';
        const isOpen = el.tags?.opening_hours ? (el.tags.opening_hours.includes('24/7') ? '24/7 Emergency Open' : 'Check Hours') : 'Emergency Open';
        status = `${isOpen} • ${fakeRating} ★`;
        image = 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=600';
        desc = 'Provides medical care';
      } else if (isShelter) {
        type = 'Colony';
        filterCategory = 'shelter';
        name = el.tags?.name || 'Cat Community Care Center';
        status = `Intake Open • ${fakeRating} ★`;
        image = 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&q=80&w=600';
        desc = 'Provides safe housing & community shelter';
      } else if (isPetShop) {
        type = 'Feeding Station';
        filterCategory = 'cat_shop';
        name = el.tags?.name || 'Cat Shop & Supplies';
        status = `Open • ${fakeRating} ★`;
        image = 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=600';
        desc = 'Feline food, toys, and supplies';
      } else {
        return;
      }

      const addressParts = [];
      if (el.tags?.['addr:housenumber']) addressParts.push(el.tags['addr:housenumber']);
      if (el.tags?.['addr:street']) addressParts.push(el.tags['addr:street']);
      if (el.tags?.['addr:suburb']) addressParts.push(el.tags['addr:suburb']);
      if (el.tags?.['addr:city']) addressParts.push(el.tags['addr:city']);
      const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : '';

      overpassResult.push({
        id: `osm-${el.id || i}-${Date.now()}`,
        type,
        name,
        status,
        distance: `${dist.toFixed(2)} km`,
        priority: type === 'Vet' ? 'Medium' : 'Low',
        lat: plat,
        lng: plon,
        image,
        reportedBy: 'Verified Registry',
        reportedTime: 'Live API',
        aiAnalysis: [
          el.tags?.phone ? `Phone: ${el.tags.phone}` : 'Contact details unavailable',
          el.tags?.website ? `Website: ${el.tags.website}` : 'Verified via OpenStreetMap',
          el.tags?.opening_hours ? `Hours: ${el.tags.opening_hours}` : 'Opening hours: Check online',
          formattedAddress ? `Address: ${formattedAddress}` : 'Address: GPS pin coordinates',
          desc
        ],
        filterCategory
      });
    });

    res.json({ places: overpassResult });
  } catch (err) {
    console.error("All Overpass API mirrors failed or timed out:", err);
    res.json({ places: [] });
  }
};
