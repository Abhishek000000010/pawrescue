import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    avatar: {
      type: String,
    },
    gender: {
      type: String,
    },
    address: {
      type: String,
    },
    dob: {
      type: String,
    },
    postalCode: {
      type: String,
    },
    role: {
      type: String,
      enum: ['citizen', 'volunteer', 'foster', 'vet', 'admin'],
      default: 'citizen',
    },
    location: {
      city: String,
      state: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    volunteerRoles: [
      {
        type: String,
      },
    ],
    availability: {
      type: String,
    },
    // Opt-in: show this foster's approximate location on the public rescue map.
    showOnMap: {
      type: Boolean,
      default: false,
    },
    codeOfConductAccepted: {
      type: Boolean,
      default: false,
    },
    volunteerAppliedAt: {
      type: Date,
    },
    points: {
      type: Number,
      default: 0,
    },
    badges: [
      {
        name: String,
        icon: String,
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    reportsCount: { type: Number, default: 0 },
    missionsCompleted: { type: Number, default: 0 },
    catsRescued: { type: Number, default: 0 },
    catsAdopted: { type: Number, default: 0 },
    donations: [
      {
        amount: Number,
        transactionId: String,
        address: String,
        date: { type: Date, default: Date.now },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  // Mongoose 9 async hooks resolve via the returned promise — no `next`.
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
