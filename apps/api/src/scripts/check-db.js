require('dotenv').config();

const { sequelize } = require('../config/database');

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
  } finally {
    await sequelize.close();
  }
}

checkDatabase().catch((error) => {
  console.error('Database connection failed:', error);
  process.exit(1);
});
