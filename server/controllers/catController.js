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

    // Collect uploaded photo URLs from Multer/Cloudinary
    const photos = req.files ? req.files.map((f) => f.path) : [];

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
