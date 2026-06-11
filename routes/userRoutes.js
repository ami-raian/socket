const router               = require('express').Router();
const userController       = require('../controllers/userController');
const enrolledUserController = require('../controllers/enrolledUserController');

// GET  /api/users?page=1&length=10&businessId=&filters={}
//   → enrolled users (the customers you chat with)
router.get('/', enrolledUserController.getAll);

// PATCH /api/users/:userId  { isOnline: true|false }
//   → agent online/offline status
router.patch('/:userId', userController.updateStatus);

module.exports = router;
