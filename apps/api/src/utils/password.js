const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function createPasswordSalt() {
  return crypto.randomBytes(16).toString('hex');
}

async function hashPassword(password, salt) {
  const rounds = Number(process.env.PASSWORD_SALT_ROUNDS || 12);
  return bcrypt.hash(`${password}${salt}`, rounds);
}

async function verifyPassword(password, salt, hash) {
  return bcrypt.compare(`${password}${salt}`, hash);
}

module.exports = {
  createPasswordSalt,
  hashPassword,
  verifyPassword
};
