const router             = require('express').Router();
const businessController = require('../controllers/businessController');

// GET /api/businesses?page=1&length=10&filters={}
router.get('/', businessController.getAll);

module.exports = router;
