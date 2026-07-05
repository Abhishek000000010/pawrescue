import User from '../models/User.js';
import Cat from '../models/Cat.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
    });

    try {
      await import('../models/Notification.js').then(({ default: Notification }) => {
        Notification.create({
          title: 'New User Registered',
          message: `${name} has joined the platform.`,
          type: 'user_registered'
        });
      });
    } catch (e) {
      console.error('Failed to create notification', e);
    }

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Become a volunteer / Guardian (open onboarding, no manual approval)
// @route   PUT /api/auth/volunteer
// @access  Private
export const becomeVolunteer = async (req, res) => {
  try {
    const { roles, city, availability, phone, codeOfConductAccepted, lat, lng, showOnMap } = req.body;

    if (!codeOfConductAccepted) {
      return res
        .status(400)
        .json({ message: 'You must accept the Code of Conduct to become a Guardian.' });
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      return res
        .status(400)
        .json({ message: 'Please select at least one way you would like to help.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'volunteer';
    user.volunteerRoles = roles;
    user.availability = availability || user.availability;
    user.codeOfConductAccepted = true;
    user.volunteerAppliedAt = new Date();
    if (phone) user.phone = phone;
    if (city) user.set('location.city', city);

    // Fosters may share their location so nearby rescuers can find a foster home.
    // We store the exact point but only ever expose an approximate one (see below).
    const isFoster = roles.includes('foster');
    if (isFoster && typeof lat === 'number' && typeof lng === 'number') {
      user.set('location.coordinates.lat', lat);
      user.set('location.coordinates.lng', lng);
    }
    // Only fosters who explicitly opt in AND shared a location appear on the map.
    user.showOnMap = Boolean(
      isFoster &&
        showOnMap &&
        typeof user.location?.coordinates?.lat === 'number'
    );

    await user.save();

    if (isFoster) {
      try {
        await import('../models/Notification.js').then(({ default: Notification }) => {
          Notification.create({
            title: 'New Foster Registered',
            message: `${user.name} has signed up as a Foster.`,
            type: 'foster_added'
          });
        });
      } catch (e) {
        console.error('Failed to create notification', e);
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      volunteerRoles: user.volunteerRoles,
      availability: user.availability,
      location: user.location,
      volunteerAppliedAt: user.volunteerAppliedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get opted-in fosters near a location (approximate coords only)
// @route   GET /api/auth/fosters
// @access  Public
export const getNearbyFosters = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = parseFloat(req.query.radius) || 25;

    const fosters = await User.find({
      role: 'volunteer',
      volunteerRoles: 'foster',
      showOnMap: true,
      'location.coordinates.lat': { $ne: null },
    }).select('name location volunteerRoles availability');

    // Haversine distance in km
    const distanceKm = (aLat, aLng, bLat, bLng) => {
      const R = 6371;
      const dLat = ((bLat - aLat) * Math.PI) / 180;
      const dLng = ((bLng - aLng) * Math.PI) / 180;
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((aLat * Math.PI) / 180) *
          Math.cos((bLat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    };

    const hasOrigin = Number.isFinite(lat) && Number.isFinite(lng);

    const result = fosters
      .map((f) => {
        const fLat = f.location?.coordinates?.lat;
        const fLng = f.location?.coordinates?.lng;
        if (typeof fLat !== 'number' || typeof fLng !== 'number') return null;

        const distance = hasOrigin ? distanceKm(lat, lng, fLat, fLng) : null;
        if (distance !== null && distance > radiusKm) return null;

        return {
          id: f._id,
          firstName: (f.name || 'A Guardian').split(' ')[0],
          area: f.location?.city || 'Nearby',
          roles: f.volunteerRoles,
          availability: f.availability || null,
          // PRIVACY: never expose a foster's exact home. Snap to a ~100m grid
          // (3 decimal places) so the pin shows an approximate area only.
          approxLat: Math.round(fLat * 1000) / 1000,
          approxLng: Math.round(fLng * 1000) / 1000,
          distance: distance !== null ? Number(distance.toFixed(2)) : null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

    res.json({ fosters: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user avatar
// @route   PUT /api/auth/me/avatar
// @access  Private
export const updateUserAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    user.avatar = req.file.path;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const totalCats = await Cat.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
    const totalFosters = await User.countDocuments({ role: 'volunteer', volunteerRoles: 'foster' });
    const totalCommunityMembers = await User.countDocuments({ role: 'citizen' });

    res.json({
      totalCats,
      totalUsers,
      totalVolunteers,
      totalFosters,
      totalCommunityMembers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users for admin
// @route   GET /api/auth/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
