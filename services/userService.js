const User = require('../models/User');

const setOnline = async (userId, socketId) =>
  User.findByIdAndUpdate(userId, { isOnline: true, socketId }, { new: true });

const setOffline = async (userId) =>
  User.findByIdAndUpdate(
    userId,
    { isOnline: false, lastSeen: new Date(), socketId: null },
    { new: true }
  );

const updateStatus = async (userId, isOnline) =>
  User.findByIdAndUpdate(userId, { isOnline }, { new: true });

const getAll = async ({ page = 1, length = 10, filters } = {}) => {
  const skip  = (page - 1) * length;
  const query = filters ? buildBasicFilter(filters) : {};
  const [data, totalItems] = await Promise.all([
    User.find(query).select('-password').skip(skip).limit(Number(length)),
    User.countDocuments(query),
  ]);
  return {
    data,
    pagination: {
      totalItems,
      totalPages:  Math.ceil(totalItems / length),
      currentPage: Number(page),
      pageSize:    Number(length),
    },
  };
};

// simple text search for name/email/phone
const buildBasicFilter = (filtersParam) => {
  if (!filtersParam) return {};
  let parsed;
  try { parsed = JSON.parse(filtersParam); } catch { return {}; }
  const orClauses = parsed.or
    ? Object.entries(parsed.or).map(([key, val]) => {
        const [field] = key.split('__');
        return { [field]: { $regex: val, $options: 'i' } };
      })
    : [];
  return orClauses.length ? { $or: orClauses } : {};
};

module.exports = { setOnline, setOffline, updateStatus, getAll };
