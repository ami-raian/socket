const Business = require('../models/Business');

const buildOrFilter = (filtersParam) => {
  if (!filtersParam) return {};
  let parsed;
  try { parsed = JSON.parse(filtersParam); } catch { return {}; }
  if (!parsed.or) return {};
  const or = Object.entries(parsed.or).map(([key, val]) => {
    const [field] = key.split('__');
    return { [field]: { $regex: val, $options: 'i' } };
  });
  return or.length ? { $or: or } : {};
};

// shape DB doc → frontend IEnrolledBusiness shape
const toEnrolledItem = (doc) => {
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    _id:                String(d._id),
    businessId:         String(d._id),
    bId:                d.bId,
    businessStatus:     d.status,
    subscriptionStatus: d.subscriptionStatus,
    businessInfo: {
      _id:             String(d._id),
      bId:             d.bId,
      businessInitial: d.businessInitial,
      name:            d.name,
      phone:           d.phone,
      status:          d.status,
      profilePhoto:    d.profilePhoto,
      verifiedAt:      d.verifiedAt,
    },
  };
};

const getAll = async ({ page = 1, length = 10, filters } = {}) => {
  const filter = buildOrFilter(filters);
  const skip   = (page - 1) * length;
  const [docs, totalItems] = await Promise.all([
    Business.find(filter).sort({ name: 1 }).skip(skip).limit(Number(length)),
    Business.countDocuments(filter),
  ]);
  return {
    data: docs.map(toEnrolledItem),
    pagination: {
      totalItems,
      totalPages:  Math.ceil(totalItems / length),
      currentPage: Number(page),
      pageSize:    Number(length),
    },
  };
};

const getById = (id) => Business.findById(id);

module.exports = { getAll, getById, toEnrolledItem };
