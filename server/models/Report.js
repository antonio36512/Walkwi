import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reported: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  reason: {
    type: String,
    enum: ['mal_servicio', 'conducta_inapropiada', 'no_se_presento', 'maltrato_animal', 'otro'],
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed', 'action_taken'],
    default: 'pending',
  },
  adminNotes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

reportSchema.index({ reporter: 1, booking: 1 }, { unique: true });

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
export default Report;
