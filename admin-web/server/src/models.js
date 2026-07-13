import mongoose from 'mongoose';

const options = { strict: false, timestamps: true };
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  name: String, email: String, password: String,
  role: { type: String, enum: ['user', 'walker', 'admin'] },
  verified: Boolean,
  accountStatus: { type: String, enum: ['active', 'warned', 'suspended', 'blocked'], default: 'active' },
  sanction: { reason: String, until: Date, adminId: mongoose.Schema.Types.ObjectId },
  pets: [{
    name: String,
    photoUri: String,
    breed: String,
    weight: String,
    age: String,
    insured: { type: Boolean, default: false },
    careNotes: String,
  }],
}, options));

const Report = mongoose.models.Report || mongoose.model('Report', new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reported: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  reason: String, description: String,
  status: { type: String, enum: ['pending', 'reviewed', 'dismissed', 'action_taken'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  adminNotes: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, options));

const Booking = mongoose.models.Booking || mongoose.model('Booking', new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  walker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  petName: String,
  petId: mongoose.Schema.Types.ObjectId,
  startTime: Date,
  duration: Number,
  status: String,
  price: Number,
  cancelReason: String,
  paymentStatus: String,
  location: mongoose.Schema.Types.Mixed,
  tracking: mongoose.Schema.Types.Mixed,
}, options));
const AuditLog = mongoose.models.AdminAuditLog || mongoose.model('AdminAuditLog', new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entityType: String, entityId: mongoose.Schema.Types.ObjectId,
  before: mongoose.Schema.Types.Mixed, after: mongoose.Schema.Types.Mixed,
  reason: String, ip: String,
}, { timestamps: true }));
const Review = mongoose.models.Review || mongoose.model('Review', new mongoose.Schema({booking:{type:mongoose.Schema.Types.ObjectId,ref:'Booking'},reviewer:{type:mongoose.Schema.Types.ObjectId,ref:'User'},reviewed:{type:mongoose.Schema.Types.ObjectId,ref:'User'},rating:Number,comment:String},{timestamps:true}));

export { User, Report, Booking, AuditLog, Review };
