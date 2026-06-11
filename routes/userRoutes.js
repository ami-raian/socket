const router         = require('express').Router();
const userController = require('../controllers/userController');

// GET  /api/users?page=1&length=10&filters={}
router.get('/', userController.getAll);

// PATCH /api/users/:userId  { isOnline: true|false }
router.patch('/:userId', userController.updateStatus);

module.exports = router;
