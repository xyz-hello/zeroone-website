const path = require('path');
const { DataTypes } = require('sequelize');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const { sequelize } = require('../config/database');

async function migrate() {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  const normalizedTables = tables.map((table) => (typeof table === 'string' ? table : table.tableName));

  if (!normalizedTables.includes('users')) {
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
  } else {
    console.log('Users table already exists.');
  }

  if (!normalizedTables.includes('mail_configs')) {
    await queryInterface.createTable('mail_configs', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      tenant_id: {
        type: DataTypes.STRING(80),
        allowNull: false
      },
      client_id: {
        type: DataTypes.STRING(80),
        allowNull: false
      },
      client_secret: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      sender_email: {
        type: DataTypes.STRING(180),
        allowNull: false
      },
      recipient_email: {
        type: DataTypes.STRING(180),
        allowNull: false
      },
      secret_expires_at: {
        type: DataTypes.DATE,
        allowNull: true
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

    console.log('Created mail_configs table.');
  } else {
    console.log('Mail configs table already exists.');
  }
}

if (require.main === module) {
  migrate()
    .catch((error) => {
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
