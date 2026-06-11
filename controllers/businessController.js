const businessService = require('../services/businessService');

const getAll = async (req, res, next) => {
  try {
    const { page, length, filters } = req.query;
    const result = await businessService.getAll({ page, length, filters });
    res.json({ success: true, message: 'Enrolled businesses fetched successfully', ...result });
  } catch (err) { next(err); }
};

module.exports = { getAll };
