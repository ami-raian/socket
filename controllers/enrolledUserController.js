const enrolledUserService = require('../services/enrolledUserService');

const getAll = async (req, res, next) => {
  try {
    const { page, length, filters, businessId } = req.query;
    const result = await enrolledUserService.getAll({ page, length, filters, businessId });
    res.json({ success: true, message: 'Users fetched successfully', ...result });
  } catch (err) { next(err); }
};

module.exports = { getAll };
