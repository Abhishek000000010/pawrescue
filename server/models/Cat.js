import mongoose from 'mongoose';

const catSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Unnamed Stray' },
    photos: [{ type: String }], // Cloudinary URLs
    location: {
      address: { type: String, required: true },
      area: String,
      city: String,
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    severity: {
      type: String,
      enum: ['critical', 'moderate', 'stable'],
      default: 'stable',
    },
    aiSeverityReason: { type: String, default: '' },
    condition: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'reported',
        'rescue_assigned',
        'rescued',
        'in_care',
        'ready_for_adoption',
        'adopted',
        'deceased',
      ],
      default: 'reported',
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rescueTimeline: [
      {
        status: String,
        note: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    tags: [String],
    healthStatus: {
      type: String,
      enum: ['Healthy', 'Injured', 'Mother/Kittens', 'Sick'],
      default: 'Healthy',
    },
    colorMarkings: String,
    estimatedAge: String,
    behaviors: [String],
    contactName: String,
    contactPhone: String,
    isAvailableForAdoption: { type: Boolean, default: false },
    fosterHome: { type: mongoose.Schema.Types.ObjectId, ref: 'FosterHome' },
    vetVisits: [
      {
        vet: { type: mongoose.Schema.Types.ObjectId, ref: 'Vet' },
        date: Date,
        notes: String,
        cost: Number,
      },
    ],
    donationsReceived: { type: Number, default: 0 },
    colonyId: String,
  },
  { timestamps: true }
);

// Index for geospatial queries
catSchema.index({ 'location.coordinates.lat': 1, 'location.coordinates.lng': 1 });
catSchema.index({ status: 1, severity: 1 });

const Cat = mongoose.model('Cat', catSchema);
export default Cat;
