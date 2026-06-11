const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
  {
    bId:             { type: String, unique: true },      // e.g. B25000004
    businessInitial: { type: String },                    // e.g. AHJ
    name:            { type: String, required: true },
    legalName:       { type: String },
    phone:           { type: String },
    email:           { type: String },
    website:         { type: String },
    status:          { type: String, enum: ['APPROVED', 'PENDING', 'SUSPENDED'], default: 'APPROVED' },
    subscriptionStatus: { type: String, enum: ['ACTIVE', 'INACTIVE', 'TRIAL'], default: 'ACTIVE' },
    profilePhoto:    { type: String },
    industry:        { type: String },
    ownerName:       { type: String },
    verifiedAt:      { type: Date },
  },
  { timestamps: true }
);

businessSchema.index({ name: 1 });
businessSchema.index({ bId: 1 });

module.exports = mongoose.model('Business', businessSchema);
