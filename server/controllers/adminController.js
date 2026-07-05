import User from '../models/User.js';
import Cat from '../models/Cat.js';
import AdoptionInquiry from '../models/AdoptionInquiry.js';

// @desc    Aggregate analytics for the admin overview
// @route   GET /api/admin/stats
// @access  Admin
export const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      volunteers,
      admins,
      totalCats,
      severityAgg,
      healthAgg,
      adoptionAgg,
      fosterCount,
      recentUsers,
      donationAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'volunteer' }),
      User.countDocuments({ role: 'admin' }),
      Cat.countDocuments(),
      Cat.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Cat.aggregate([{ $group: { _id: '$healthStatus', count: { $sum: 1 } } }]),
      AdoptionInquiry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.countDocuments({ role: 'volunteer', volunteerRoles: 'foster' }),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      User.aggregate([
        { $unwind: '$donations' },
        { $group: { _id: null, total: { $sum: '$donations.amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const toMap = (agg) =>
      agg.reduce((acc, cur) => {
        acc[cur._id || 'unknown'] = cur.count;
        return acc;
      }, {});

    res.json({
      users: { total: totalUsers, volunteers, admins, fosters: fosterCount, newThisWeek: recentUsers },
      cats: { total: totalCats, bySeverity: toMap(severityAgg), byHealth: toMap(healthAgg) },
      adoptions: { byStatus: toMap(adoptionAgg) },
      donations: { total: donationAgg[0]?.total || 0, count: donationAgg[0]?.count || 0 },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    All registered users
// @route   GET /api/admin/users
// @access  Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -otp')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    All reported cats (frontend groups by severity / health)
// @route   GET /api/admin/cats
// @access  Admin
export const getCats = async (req, res) => {
  try {
    const cats = await Cat.find()
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name email')
      .lean();
    res.json({ cats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    All adoption requests
// @route   GET /api/admin/adoptions
// @access  Admin
export const getAdoptions = async (req, res) => {
  try {
    const adoptions = await AdoptionInquiry.find()
      .sort({ createdAt: -1 })
      .populate('catId', 'name photos healthStatus severity colorMarkings')
      .populate('userId', 'name email')
      .lean();
    res.json({ adoptions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve / reject an adoption request
// @route   PUT /api/admin/adoptions/:id/status
// @access  Admin
export const updateAdoptionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'reviewing', 'approved', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const inquiry = await AdoptionInquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!inquiry) {
      return res.status(404).json({ message: 'Adoption request not found.' });
    }

    // When approved, mark the cat as adopted.
    if (status === 'approved' && inquiry.catId) {
      await Cat.findByIdAndUpdate(inquiry.catId, { status: 'adopted' });
    }

    res.json({ inquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    All donations (flattened across users) with donor info
// @route   GET /api/admin/donations
// @access  Admin
export const getDonations = async (req, res) => {
  try {
    const users = await User.find({ 'donations.0': { $exists: true } })
      .select('name email donations')
      .lean();

    const donations = [];
    users.forEach((u) => {
      (u.donations || []).forEach((d) => {
        donations.push({
          _id: d._id,
          donorId: u._id,
          donorName: u.name,
          donorEmail: u.email,
          amount: d.amount,
          transactionId: d.transactionId,
          address: d.address,
          date: d.date,
        });
      });
    });

    donations.sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalAmount = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    res.json({ donations, totalAmount, count: donations.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    All fosters with full details
// @route   GET /api/admin/fosters
// @access  Admin
export const getFosters = async (req, res) => {
  try {
    const fosters = await User.find({ role: 'volunteer', volunteerRoles: 'foster' })
      .select('name email phone location volunteerRoles availability showOnMap createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ fosters });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
