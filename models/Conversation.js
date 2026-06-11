const mongoose = require('mongoose');

const agentRefSchema = new mongoose.Schema(
  {
    userId: String,
    name:   String,
    email:  String,
  },
  { _id: false }
);

const participantSchema = new mongoose.Schema(
  {
    _id:             String,
    bId:             String,
    uId:             String,
    businessInitial: String,
    name:            String,
    phone:           String,
    email:           String,
    profilePhoto:    String,
    profileImage:    String,
    referral:        String,
    currency:        String,
    isBusiness:      { type: Boolean, default: false },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    conversationType:   { type: String, enum: ['OFFICIAL', 'PERSONAL'], default: 'OFFICIAL' },
    tradeAccountNumber: { type: String },
    tradeAccountId:     { type: mongoose.Schema.Types.ObjectId },
    distributionStatus: { type: String, enum: ['ASSIGNED', 'UNASSIGNED'], default: 'UNASSIGNED' },
    status:             { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
    lastAction:         { type: String },
    totalMessages:      { type: Number, default: 0 },
    unSeenMessages:     { type: Number, default: 0 },
    whatsapp:           { type: Boolean, default: false },
    lastMessage:        { type: String },
    lastMessageTime:    { type: Date },
    businessId:         { type: String },
    participants:       [participantSchema],

    assignedAgent:  agentRefSchema,
    closedBy:       agentRefSchema,
    closedAt:       { type: Date },
    reason:         { type: String },

    previousAgent:  agentRefSchema,
    transferredTo:  agentRefSchema,
    transferredBy:  agentRefSchema,
    transferredAt:  { type: Date },

    isSeen:  { type: Boolean, default: false },
    seenBy:  agentRefSchema,
    seenAt:  { type: Date },
  },
  { timestamps: true }
);

conversationSchema.index({ businessId: 1, lastMessageTime: -1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ 'participants.phone': 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
