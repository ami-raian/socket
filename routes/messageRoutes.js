const router            = require('express').Router();
const messageController = require('../controllers/messageController');
const { upload }        = require('../middleware/upload');

// GET  /api/messages/:conversationId  — message history
router.get('/:conversationId', messageController.getByConversation);

// POST /api/messages  — new conversation + first message (multipart)
router.post('/', upload.array('media'), messageController.sendNewConversation);

// POST /api/messages/:conversationId  — reply in existing conversation (multipart)
router.post('/:conversationId', upload.array('media'), messageController.sendReply);

module.exports = router;
