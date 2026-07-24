const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const { sequelize } = require('../config/database');
const { User } = require('../models');
const { createPasswordSalt, hashPassword } = require('../utils/password');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'ZeroOne Admin';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required.');
  }

  await sequelize.authenticate();

  const salt = createPasswordSalt();
  const passwordHash = await hashPassword(password, salt);
  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({
    where: {
      email: normalizedEmail
    }
  });

  if (existingUser) {
    await existingUser.update({
      name,
      passwordHash,
      passwordSalt: salt,
      role: 1,
      isActive: true
    });
    console.log(`Updated admin user: ${normalizedEmail}`);
    return;
  }

  await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    passwordSalt: salt,
    role: 1,
    isActive: true
  });

  console.log(`Created admin user: ${normalizedEmail}`);
}

if (require.main === module) {
  seedAdmin()
    .catch((error) => {
      console.error('Admin seed failed:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sequelize.close().catch(() => {});
    });
}

module.exports = {
  seedAdmin
};
