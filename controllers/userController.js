const userService = require('../services/userService');

const getAll = async (req, res, next) => {
  try {
    const { page, length, filters } = req.query;
    const result = await userService.getAll({ page, length, filters });
    res.json({ success: true, message: 'Users fetched successfully', ...result });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { userId }   = req.params;
    const { isOnline } = req.body;
    await userService.updateStatus(userId, isOnline);
    res.json({ success: true, message: 'Online status updated' });
  } catch (err) { next(err); }
};

module.exports = { getAll, updateStatus };
