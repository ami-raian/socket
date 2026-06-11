const Conversation = require('../models/Conversation');

// parse ?filters= JSON → mongo query
const buildFilter = (filtersParam) => {
  if (!filtersParam) return {};
  let parsed;
  try { parsed = JSON.parse(filtersParam); } catch { return {}; }

  const toCondition = (key, value) => {
    const [field, op] = key.split('__');
    if (op === 'like') return { [field]: { $regex: value, $options: 'i' } };
    if (op === 'gte')  return { [field]: { $gte: value } };
    if (op === 'lte')  return { [field]: { $lte: value } };
    return { [field]: value };
  };

  const conditions = [];
  if (parsed.and) conditions.push({ $and: Object.entries(parsed.and).map(([k, v]) => toCondition(k, v)) });
  if (parsed.or)  conditions.push({ $or:  Object.entries(parsed.or).map(([k, v])  => toCondition(k, v)) });

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { $and: conditions };
};

// shape DB doc → ConversationListItem (matches frontend type exactly)
const toListItem = (doc) => {
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    _id:                String(d._id),
    conversationType:   d.conversationType   ?? 'OFFICIAL',
    tradeAccountNumber: d.tradeAccountNumber ?? '',
    distributionStatus: d.distributionStatus ?? 'UNASSIGNED',
    totalMessages:      d.totalMessages      ?? 0,
    unSeenMessages:     d.unSeenMessages      ?? 0,
    whatsapp:           d.whatsapp            ?? false,
    lastMessage:        d.lastMessage         ?? '',
    lastMessageTime:    d.lastMessageTime     ?? d.updatedAt ?? d.createdAt,
    participants:       d.participants        ?? [],
    assignee:           d.assignedAgent       ?? null,
    inboxStatus:        d.status === 'CLOSED' ? 'resolved' : 'open',
    inboxPriority:      d.inboxPriority       ?? 'medium',
    createdAt:          d.createdAt,
    updatedAt:          d.updatedAt,
  };
};

const getAll = async ({ page = 1, length = 10, filters } = {}) => {
  const filter     = buildFilter(filters);
  const skip       = (page - 1) * length;
  const [docs, totalItems] = await Promise.all([
    Conversation.find(filter).sort({ lastMessageTime: -1 }).skip(skip).limit(Number(length)),
    Conversation.countDocuments(filter),
  ]);
  return {
    data: docs.map(toListItem),
    pagination: {
      totalItems,
      totalPages:  Math.ceil(totalItems / length),
      currentPage: Number(page),
      pageSize:    Number(length),
    },
  };
};

const getById = async (conversationId) => {
  const doc = await Conversation.findById(conversationId);
  return doc ? toListItem(doc) : null;
};

const create = async (payload) => {
  const doc = await Conversation.create(payload);
  return toListItem(doc);
};

const markSeen = async (conversationId, agentInfo) => {
  const seenAt = new Date();
  await Conversation.findByIdAndUpdate(conversationId, {
    isSeen: true, unSeenMessages: 0, seenBy: agentInfo, seenAt,
  });
  return { seenAt };
};

const markDelivered = async (conversationId) => {
  const deliveredAt = new Date();
  await Conversation.findByIdAndUpdate(conversationId, { lastAction: 'DELIVERED' });
  return { deliveredAt };
};

const close = async (conversationId, { reason, agentInfo }) => {
  const closedAt = new Date();
  await Conversation.findByIdAndUpdate(conversationId, {
    status: 'CLOSED', reason, closedBy: agentInfo, closedAt, lastAction: 'CLOSED',
  });
  return { closedAt };
};

const transfer = async (conversationId, { targetUserInfo, agentInfo, reason }) => {
  const existing      = await Conversation.findById(conversationId);
  const previousAgent = existing?.assignedAgent ?? null;
  const transferredAt = new Date();
  await Conversation.findByIdAndUpdate(conversationId, {
    assignedAgent:      targetUserInfo,
    previousAgent,
    transferredTo:      targetUserInfo,
    transferredBy:      agentInfo,
    transferredAt,
    lastAction:         'TRANSFERRED',
    distributionStatus: 'ASSIGNED',
  });
  return { previousAgent, transferredAt };
};

const linkTradeAccount = async (conversationId, { tradeAccountId, tradeAccountNumber }) =>
  Conversation.findByIdAndUpdate(conversationId, { tradeAccountId, tradeAccountNumber }, { new: true });

const incrementUnSeen = async (conversationId, lastMessage) =>
  Conversation.findByIdAndUpdate(conversationId, {
    lastMessage,
    lastMessageTime: new Date(),
    $inc: { totalMessages: 1, unSeenMessages: 1 },
  });

module.exports = {
  getAll, getById, create, markSeen, markDelivered,
  close, transfer, linkTradeAccount, incrementUnSeen, toListItem,
};
