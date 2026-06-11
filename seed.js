require('dotenv').config();
const mongoose     = require('mongoose');
const { connect }  = require('./config/db');
const Business     = require('./models/Business');
const EnrolledUser = require('./models/EnrolledUser');

const businesses = [
  { bId: 'B25000001', businessInitial: 'DNC', name: 'Dune Cargo',                     legalName: 'Dune Cargo L.L.C',                phone: '+971547209775', email: 'ops@dunecargo.ae',  status: 'APPROVED', subscriptionStatus: 'ACTIVE', industry: 'Logistics', ownerName: 'Hamad Al Falasi',  verifiedAt: new Date('2025-08-26') },
  { bId: 'B25000004', businessInitial: 'AHJ', name: 'ASLAM ABU HASHEM JEWELLERY L.L.C', legalName: 'Aslam Abu Hashem Jewellery',  phone: '+971521268127', email: 'info@ahjewellery.ae', status: 'APPROVED', subscriptionStatus: 'ACTIVE', industry: 'Jewellery', ownerName: 'Aslam Abu Hashem', verifiedAt: new Date('2025-08-26') },
  { bId: 'B25000007', businessInitial: 'KNJ', name: 'Karnaphuli Jewellery Trading',     legalName: 'Karnaphuli Jewellery Trading LLC', phone: '+971547200001', email: 'hello@knj.ae',     status: 'APPROVED', subscriptionStatus: 'ACTIVE', industry: 'Jewellery', ownerName: 'Karim Ullah',      verifiedAt: new Date('2025-09-01') },
];

const usersByBusiness = {
  'B25000001': [
    { uId: 'U2600037', name: 'Mehedi Ratul',      email: 'mehedi.ratul@gmail.com',  phone: '+8801700000001', currency: 'AED', kycStatus: 'APPROVED' },
    { uId: 'U2600109', name: 'Majharul Islam',    email: 'majharul.flutter@gmail.com', phone: '+8801798112713', currency: 'AED', kycStatus: 'APPROVED', referral: 'M27A13' },
    { uId: 'U2600210', name: 'Robiul Hasan Raian', email: 'ami.robirai@gmail.com',  phone: '+8801798112700', currency: 'AED', kycStatus: 'APPROVED' },
  ],
  'B25000004': [
    { uId: 'U2501243', name: 'Ultimate Yusuf',    email: 'ultimate.yusuf@gmail.com', phone: '+8801303211684', currency: 'BDT', kycStatus: 'APPROVED' },
    { uId: 'U2600311', name: 'Sadia Afrin',       email: 'sadia.afrin@gmail.com',   phone: '+8801711000311', currency: 'AED', kycStatus: 'PENDING' },
  ],
  'B25000007': [
    { uId: 'U2600412', name: 'Karim Ullah',       email: 'karim.ullah@gmail.com',   phone: '+8801911000412', currency: 'AED', kycStatus: 'APPROVED' },
  ],
};

async function run() {
  await connect();

  console.log('[seed] clearing existing businesses & users…');
  await Business.deleteMany({});
  await EnrolledUser.deleteMany({});

  console.log('[seed] inserting businesses…');
  const insertedBusinesses = await Business.insertMany(businesses);
  const byBid = Object.fromEntries(insertedBusinesses.map((b) => [b.bId, b]));

  console.log('[seed] inserting enrolled users…');
  let userCount = 0;
  for (const [bId, users] of Object.entries(usersByBusiness)) {
    const business = byBid[bId];
    for (const u of users) {
      await EnrolledUser.create({ ...u, businessIds: [business._id] });
      userCount += 1;
    }
  }

  console.log(`[seed] done — ${insertedBusinesses.length} businesses, ${userCount} users.`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
