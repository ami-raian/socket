const SupportMessage = require('../models/SupportMessage');
const Conversation   = require('../models/Conversation');

// shape a DB doc into the ApiMessage format the frontend expects
const toApiMessage = (doc) => {
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    _id:           d._id,
    conversationId: String(d.conversationId),
    messageContext: {
      type:   d.messageContext?.type   ?? 'TEXT',
      body:   d.messageContext?.body   ?? '',
      source: d.messageContext?.source ?? 'SUPPORT',
      media:  d.messageContext?.media  ?? [],
    },
    senderInfo: {
      _id:        d.senderInfo?._id   ?? '',
      isBusiness: d.senderInfo?.isBusiness ?? false,
      name:       d.senderInfo?.name  ?? 'Agent',
      email:      d.senderInfo?.email ?? null,
      phone:      d.senderInfo?.phone ?? null,
      photo:      d.senderInfo?.photo ?? null,
    },
    hasContext:        !!d.hasContext,
    contextInfo:       d.contextInfo       ?? null,
    contextSenderInfo: d.contextSenderInfo ?? null,
    deliveryInfo: {
      sendAt:      d.deliveryInfo?.sendAt      ?? d.createdAt,
      deliveredAt: d.deliveryInfo?.deliveredAt ?? null,
      seenAt:      d.deliveryInfo?.seenAt      ?? null,
    },
    referenceInfo: {
      service:            d.referenceInfo?.service            ?? 'META',
      tradeAccountNumber: d.referenceInfo?.tradeAccountNumber ?? '',
    },
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    deletedAt: d.deletedAt ?? null,
  };
};

const getByConversation = async (conversationId) => {
  const docs = await SupportMessage.find({
    conversationId,
    deletedAt: { $exists: false },
  }).sort({ createdAt: 1 });
  return docs.map(toApiMessage);
};

const create = async (payload) => {
  const {
    conversationId,
    content,
    senderInfo,
    agentType = 'HUMAN',
    senderType,
    senderId,
    recipientId,
    manualType,
    tradeAccountId,
    tradeAccountNumber,
    conversationType,
    templateLanguage,
    templateVariables,
    contextContent,
    contextType,
    contextMediaPath,
    contextSenderInfo,
    media = [],
  } = payload;

  const messageType = media.length > 0 ? 'MEDIA' : 'TEXT';

  const doc = await SupportMessage.create({
    conversationId,
    messageContext: {
      type:   messageType,
      body:   content,
      source: 'SUPPORT',
      media:  media.map((m) => ({ type: m.type, url: m.url })),
    },
    senderInfo,
    hasContext:  !!contextContent,
    contextInfo: contextContent
      ? {
          type:  contextType || 'TEXT',
          body:  contextContent,
          media: contextMediaPath ? [{ type: contextType, url: contextMediaPath }] : [],
        }
      : undefined,
    contextSenderInfo: contextSenderInfo ?? undefined,
    agentType,
    senderType,
    senderId,
    recipientId,
    manualType,
    tradeAccountId,
    tradeAccountNumber,
    conversationType,
    templateLanguage,
    templateVariables,
    deliveryInfo:  { sendAt: new Date() },
    referenceInfo: { tradeAccountNumber },
    createdBy: senderInfo ? { userId: senderInfo._id, name: senderInfo.name } : undefined,
  });

  // update parent conversation
  const lastText = content || (media.length ? '[media]' : '');
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage:     lastText,
    lastMessageTime: new Date(),
    $inc:            { totalMessages: 1 },
  });

  return toApiMessage(doc);
};

const markConversationSeen = async (conversationId) => {
  const seenAt = new Date();
  await SupportMessage.updateMany(
    { conversationId, 'deliveryInfo.seenAt': { $exists: false } },
    { $set: { 'deliveryInfo.seenAt': seenAt } }
  );
  return seenAt;
};

const markConversationDelivered = async (conversationId) => {
  const deliveredAt = new Date();
  await SupportMessage.updateMany(
    { conversationId, 'deliveryInfo.deliveredAt': { $exists: false } },
    { $set: { 'deliveryInfo.deliveredAt': deliveredAt } }
  );
  return deliveredAt;
};

module.exports = { getByConversation, create, markConversationSeen, markConversationDelivered, toApiMessage };
