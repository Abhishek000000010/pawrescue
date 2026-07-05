import Mission from '../models/Mission.js';
import Cat from '../models/Cat.js';
import { getIO } from '../services/socketService.js';

export const createMission = async (req, res) => {
  try {
    const mission = await Mission.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populatedMission = await Mission.findById(mission._id)
      .populate('cat')
      .populate('createdBy', 'name');

    // Emit event to all connected clients
    try {
      getIO().emit('new_mission', populatedMission);
    } catch (err) {
      console.error('Socket error emitting new_mission:', err);
    }

    res.status(201).json(populatedMission);
  } catch (error) {
    res.status(500).json({ message: 'Error creating mission', error: error.message });
  }
};

export const getMissions = async (req, res) => {
  try {
    const { status, city } = req.query;
    const filter = {};
    if (status) filter.status = status;
    
    // We could filter by city by joining Cat location if needed, 
    // but keeping it simple for now and getting all open/claimed.

    const missions = await Mission.find(filter)
      .populate('cat')
      .populate('createdBy', 'name')
      .populate('claimedBy', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(missions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching missions', error: error.message });
  }
};

export const claimMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);

    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }

    if (mission.status !== 'open') {
      return res.status(400).json({ message: 'Mission is already claimed or completed' });
    }

    mission.status = 'claimed';
    mission.claimedBy = req.user._id;
    await mission.save();

    // If this mission is linked to a cat rescue, update cat status
    if (mission.cat && mission.type === 'rescue') {
      const cat = await Cat.findById(mission.cat);
      if (cat) {
        cat.status = 'rescue_assigned';
        cat.assignedVolunteer = req.user._id;
        cat.rescueTimeline.push({
          status: 'rescue_assigned',
          note: `Rescue mission claimed by ${req.user.name}`,
          updatedBy: req.user._id,
          timestamp: new Date()
        });
        await cat.save();
        
        // Broadcast cat update
        getIO().emit('cat_status_update', cat);
      }
    }

    const populatedMission = await Mission.findById(mission._id)
      .populate('cat')
      .populate('createdBy', 'name')
      .populate('claimedBy', 'name avatar');

    getIO().emit('mission_updated', populatedMission);

    res.json(populatedMission);
  } catch (error) {
    res.status(500).json({ message: 'Error claiming mission', error: error.message });
  }
};

export const completeMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);

    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }

    if (mission.claimedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to complete this mission' });
    }

    mission.status = 'pending_approval';
    mission.completedAt = new Date();
    if (req.file) {
      mission.completionProof = [req.file.path];
    }
    if (req.body.notes) {
      mission.completionNotes = req.body.notes;
    }
    await mission.save();

    const populatedMission = await Mission.findById(mission._id)
      .populate('cat')
      .populate('createdBy', 'name')
      .populate('claimedBy', 'name avatar');

    getIO().emit('mission_updated', populatedMission);

    res.json(populatedMission);
  } catch (error) {
    res.status(500).json({ message: 'Error completing mission', error: error.message });
  }
};

export const approveMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id).populate('claimedBy');

    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }

    if (mission.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Mission is not pending approval' });
    }

    mission.status = 'completed';
    await mission.save();

    // Reward points to user
    const user = mission.claimedBy;
    if (user) {
      user.points = (user.points || 0) + mission.pointsReward;
      user.missionsCompleted = (user.missionsCompleted || 0) + 1;
      await user.save();
    }

    // If linked to a cat rescue, update cat status
    if (mission.cat && mission.type === 'rescue') {
      const cat = await Cat.findById(mission.cat);
      if (cat) {
        cat.status = 'rescued';
        cat.rescueTimeline.push({
          status: 'rescued',
          note: `Cat successfully rescued by ${user.name} (Approved by Admin)`,
          updatedBy: req.user._id,
          timestamp: new Date()
        });
        await cat.save();
        getIO().emit('cat_status_update', cat);
      }
    }

    const populatedMission = await Mission.findById(mission._id)
      .populate('cat')
      .populate('createdBy', 'name')
      .populate('claimedBy', 'name avatar');

    getIO().emit('mission_updated', populatedMission);

    res.json(populatedMission);
  } catch (error) {
    res.status(500).json({ message: 'Error approving mission', error: error.message });
  }
};

export const rejectMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);

    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }

    if (mission.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Mission is not pending approval' });
    }

    mission.status = 'claimed'; // Revert back to claimed so they can resubmit
    mission.completionProof = [];
    mission.completionNotes = '';
    
    await mission.save();

    const populatedMission = await Mission.findById(mission._id)
      .populate('cat')
      .populate('createdBy', 'name')
      .populate('claimedBy', 'name avatar');

    getIO().emit('mission_updated', populatedMission);

    res.json(populatedMission);
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting mission', error: error.message });
  }
};
