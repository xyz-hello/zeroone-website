const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const { sequelize } = require('../config/database');
const { User } = require('../models');
const { createPasswordSalt, hashPassword } = require('../utils/password');

async function seedSuperadmin() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME || 'ZeroOne Superadmin';

  if (!email || !password) {
    throw new Error('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD are required.');
  }

  await sequelize.authenticate();

  const existingUser = await User.findOne({
    where: {
      email: email.toLowerCase()
    }
  });

  if (existingUser) {
    console.log(`Superadmin already exists: ${email}`);
    return;
  }

  const salt = createPasswordSalt();
  const passwordHash = await hashPassword(password, salt);

  await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    passwordSalt: salt,
    role: 0,
    isActive: true
  });

  console.log(`Created superadmin user: ${email}`);
}

if (require.main === module) {
  seedSuperadmin()
    .catch((error) => {
      console.error('Superadmin seed failed:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sequelize.close().catch(() => {});
    });
}

module.exports = {
  seedSuperadmin
};
