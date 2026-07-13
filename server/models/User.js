import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: false,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  passwordResetToken: {
    type: String,
    trim: true,
    default: null,
  },
  passwordResetExpires: {
    type: Date,
    default: null,
  },
  profilePhotoUri: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'walker'],
    default: 'user',
  },
  location: {
    type: String,
    trim: true,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  experience: {
    type: String,
    trim: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  pricePerHour: {
    type: Number,
    default: 0,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  accountStatus: { type: String, enum: ['active', 'warned', 'suspended', 'blocked'], default: 'active' },
  sanction: {
    reason: { type: String, trim: true },
    until: { type: Date },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  bio: {
    type: String,
    trim: true,
  },
  availableDays: [{
    type: String,
    enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
  }],
  availableHours: {
    start: { type: String },
    end: { type: String },
  },
  completedWalks: {
    type: Number,
    default: 0,
  },
  pets: [{
    name: {
      type: String,
      trim: true,
    },
    photoUri: {
      type: String,
      trim: true,
    },
    breed: {
      type: String,
      trim: true,
    },
    weight: {
      type: String,
      trim: true,
    },
    age: {
      type: String,
      trim: true,
    },
    insured: {
      type: Boolean,
      default: false,
    },
    careNotes: {
      type: String,
      trim: true,
    },
  }],
}, {
  timestamps: true,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
