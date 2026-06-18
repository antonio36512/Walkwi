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
    required: true,
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
    enum: ['user', 'walker', 'caregiver'],
    default: 'user',
  },
  location: {
    type: String,
    trim: true,
  },
  experience: {
    type: String,
    trim: true,
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
