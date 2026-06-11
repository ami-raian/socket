const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  { type: String, url: String },
  { _id: false }
);

const senderInfoSchema = new mongoose.Schema(
  {
    _id:        String,
    isBusiness: { type: Boolean, default: false },
    name:       String,
    email:      String,
    phone:      String,
    photo:      String,
  },
  { _id: false }
);

const byRefSchema = new mongoose.Schema(
  { userId: String, name: String },
  { _id: false }
);

const supportMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Conversation',
      required: true,
    },

    messageContext: {
      type:   { type: String, enum: ['TEXT', 'MEDIA'], default: 'TEXT' },
      body:   String,
      source: { type: String, enum: ['WHATSAPP', 'DREAMIX', 'SUPPORT'], default: 'SUPPORT' },
      media:  [mediaSchema],
    },

    senderInfo: senderInfoSchema,

    hasContext:  { type: Boolean, default: false },
    contextInfo: {
      type:  { type: String, enum: ['TEXT', 'MEDIA'] },
      body:  String,
      media: [mediaSchema],
    },
    contextSenderInfo: senderInfoSchema,

    deliveryInfo: {
      sendAt:      Date,
      deliveredAt: Date,
      seenAt:      Date,
    },

    referenceInfo: {
      service:            { type: String, enum: ['META', 'VBS'] },
      tradeAccountNumber: String,
    },

    // send-message extra fields
    agentType:         { type: String, enum: ['HUMAN', 'SYSTEM'], default: 'HUMAN' },
    senderType:        { type: String, enum: ['HUMAN', 'SYSTEM'] },
    recipientId:       String,
    senderId:          String,
    manualType:        String,
    tradeAccountId:    mongoose.Schema.Types.ObjectId,
    tradeAccountNumber: String,
    conversationType:  { type: String, enum: ['OFFICIAL', 'PERSONAL'] },
    templateLanguage:  String,
    templateVariables: mongoose.Schema.Types.Mixed,

    deletedAt: Date,
    createdBy: byRefSchema,
    updatedBy: byRefSchema,
    deletedBy: byRefSchema,
  },
  { timestamps: true }
);

supportMessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
