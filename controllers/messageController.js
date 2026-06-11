const messageService      = require('../services/messageService');
const conversationService = require('../services/conversationService');

const getByConversation = async (req, res, next) => {
  try {
    const messages = await messageService.getByConversation(req.params.conversationId);
    res.json({ success: true, message: 'Messages fetched successfully', data: messages });
  } catch (err) { next(err); }
};

// POST /api/messages  — new conversation + first message
const sendNewConversation = async (req, res, next) => {
  try {
    const {
      content, agentType, recipientId, senderId, ManualType,
      tradeAccountId, conversationType, tradeAccountNumber,
      templateLanguage, template_variables,
      contextContent, contextSenderName, contextMediaPath, contextType,
    } = req.body;

    const files = buildFileList(req.files);

    // create conversation first
    const conversation = await conversationService.create({
      conversationType:  conversationType?.toUpperCase() || 'OFFICIAL',
      tradeAccountNumber,
      tradeAccountId,
      lastMessage:     content || (files.length ? '[media]' : ''),
      lastMessageTime: new Date(),
      totalMessages:   1,
    });

    await messageService.create({
      conversationId: conversation._id,
      content,
      agentType,
      senderId,
      recipientId,
      manualType:       ManualType,
      tradeAccountId,
      tradeAccountNumber,
      conversationType: conversationType?.toUpperCase(),
      templateLanguage,
      templateVariables: template_variables ? JSON.parse(template_variables) : undefined,
      contextContent,
      contextType,
      contextMediaPath,
      media: files,
    });

    // broadcast new conversation to all agents
    req.app.get('io')?.emit('conversation:new', conversation);

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: { inboxChunkSupport: { conversationId: conversation._id } },
    });
  } catch (err) { next(err); }
};

// POST /api/messages/:conversationId — reply in existing conversation
const sendReply = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const {
      content, senderId, senderInfo, tradeAccountId, tradeAccountNumber,
      senderType, ManualType, templateLanguage, template_variables,
      contextContent, contextSenderName, contextMediaPath, contextType, contextId,
    } = req.body;

    const files = buildFileList(req.files);

    const message = await messageService.create({
      conversationId,
      content,
      senderInfo:       senderInfo ? JSON.parse(senderInfo) : undefined,
      senderType,
      senderId,
      manualType:       ManualType,
      tradeAccountId,
      tradeAccountNumber,
      templateLanguage,
      templateVariables: template_variables ? JSON.parse(template_variables) : undefined,
      contextContent,
      contextType,
      contextMediaPath,
      media: files,
    });

    // broadcast to conversation room
    req.app.get('io')?.to(conversationId).emit('message:receive', message);

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) { next(err); }
};

const buildFileList = (files = []) =>
  files.map((f) => ({
    type: f.mimetype?.startsWith('image') ? 'image' : 'document',
    url:  `/uploads/${f.filename}`,
  }));

module.exports = { getByConversation, sendNewConversation, sendReply };
