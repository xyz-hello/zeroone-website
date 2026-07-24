const path = require('path');
const { DataTypes } = require('sequelize');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const { sequelize } = require('../config/database');

async function migrate() {
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.createTable('users', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    password_salt: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    role: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  console.log('Created users table.');
}

if (require.main === module) {
  migrate()
    .catch((error) => {
      if (error.original?.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('Users table already exists.');
        return;
      }

      console.error('Migration failed:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sequelize.close().catch(() => {});
    });
}

module.exports = {
  migrate
};
