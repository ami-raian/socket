const mongoose     = require('mongoose');
const EnrolledUser = require('../models/EnrolledUser');

const buildFilter = (filtersParam, businessId) => {
  const query = {};
  if (businessId) query.businessIds = businessId;

  if (filtersParam) {
    let parsed;
    try { parsed = JSON.parse(filtersParam); } catch { parsed = null; }
    if (parsed?.or) {
      query.$or = Object.entries(parsed.or).map(([key, val]) => {
        const [field] = key.split('__');
        return { [field]: { $regex: val, $options: 'i' } };
      });
    }
    if (parsed?.and) {
      Object.entries(parsed.and).forEach(([key, val]) => {
        const [field] = key.split('__');
        query[field] = val;
      });
    }
  }
  return query;
};

// shape DB doc → frontend enrolled-user shape (matches §9 userInfo)
const toItem = (doc) => {
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    _id:    String(d._id),
    userId: String(d._id),
    userInfo: {
      _id:          String(d._id),
      uId:          d.uId,
      name:         d.name,
      email:        d.email,
      phone:        d.phone,
      profileImage: d.profileImage,
      currency:     d.currency,
      kycStatus:    d.kycStatus,
      isOnline:     d.isOnline,
    },
  };
};

const getAll = async ({ page = 1, length = 10, filters, businessId } = {}) => {
  const filter = buildFilter(filters, businessId);
  const skip   = (page - 1) * length;
  const [docs, totalItems] = await Promise.all([
    EnrolledUser.find(filter).sort({ name: 1 }).skip(skip).limit(Number(length)),
    EnrolledUser.countDocuments(filter),
  ]);
  return {
    data: docs.map(toItem),
    pagination: {
      totalItems,
      totalPages:  Math.ceil(totalItems / length),
      currentPage: Number(page),
      pageSize:    Number(length),
    },
  };
};

// Resolve by uId (e.g. "U2600595") or Mongo _id — never crash on a non-ObjectId.
const getById = (id) => {
  if (!id) return null;
  const or = [{ uId: id }];
  if (mongoose.isValidObjectId(id)) or.push({ _id: id });
  return EnrolledUser.findOne({ $or: or });
};

module.exports = { getAll, getById, toItem };
