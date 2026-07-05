const User = require('../models/User');
const logger = require('../utils/logger');

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@researchhelper.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    const existing = await User.findOne({ email: adminEmail });
    if (existing) return;

    await User.create({
      email: adminEmail,
      password: adminPassword,
      name: 'Admin',
      role: 'admin',
    });

    logger.info(`✅ Default admin created: ${adminEmail}`);
  } catch (error) {
    logger.error('Admin seed error:', error.message);
  }
};

module.exports = seedAdmin;
