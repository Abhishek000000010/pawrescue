import mongoose from 'mongoose';

const missionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['feeding', 'transport', 'vet_visit', 'temp_shelter', 'rescue', 'colony_check'],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  cat: { type: mongoose.Schema.Types.ObjectId, ref: 'Cat' },
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  status: {
    type: String,
    enum: ['open', 'claimed', 'in_progress', 'completed', 'cancelled'],
    default: 'open',
  },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pointsReward: { type: Number, default: 10 },
  urgency: {
    type: String,
    enum: ['urgent', 'normal', 'low'],
    default: 'normal',
  },
  dueBy: Date,
  completionProof: [String],
  completedAt: Date,
}, { timestamps: true });

export default mongoose.model('Mission', missionSchema);
