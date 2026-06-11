const mongoose = require('mongoose');

// A user enrolled under one or more businesses — the "customer" you chat with.
const enrolledUserSchema = new mongoose.Schema(
  {
    uId:          { type: String, unique: true },   // e.g. U2600037
    name:         { type: String, required: true },
    email:        { type: String },
    phone:        { type: String },
    profileImage: { type: String },
    referral:     { type: String },
    currency:     { type: String, default: 'AED' },
    kycStatus:    { type: String, enum: ['APPROVED', 'PENDING', 'REJECTED'], default: 'APPROVED' },
    isOnline:     { type: Boolean, default: false },

    // which businesses this user belongs to
    businessIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Business' }],
  },
  { timestamps: true }
);

enrolledUserSchema.index({ name: 1 });
enrolledUserSchema.index({ phone: 1 });
enrolledUserSchema.index({ uId: 1 });
enrolledUserSchema.index({ businessIds: 1 });

module.exports = mongoose.model('EnrolledUser', enrolledUserSchema);
