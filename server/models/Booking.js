import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  walker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  petName: {
    type: String,
    required: true,
    trim: true,
  },
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  startTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  location: {
    address: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  startCode: {
    type: String,
  },
  endCode: {
    type: String,
  },
  notes: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    default: 0,
  },
  cancelReason: {
    type: String,
    trim: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  },
  tracking: {
    current: {
      latitude: Number,
      longitude: Number,
      timestamp: Date,
    },
    history: [{
      latitude: Number,
      longitude: Number,
      timestamp: Date,
    }],
  },
}, {
  timestamps: true,
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export default Booking;
