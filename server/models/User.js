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
        enum: ['rescue', 'feeding', 'transport', 'fostering', 'medical'],
      },
    ],
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
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
