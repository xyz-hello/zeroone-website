const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MailConfig = sequelize.define(
  'MailConfig',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    tenantId: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: 'tenant_id'
    },
    clientId: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: 'client_id'
    },
    clientSecret: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'client_secret'
    },
    senderEmail: {
      type: DataTypes.STRING(180),
      allowNull: false,
      field: 'sender_email',
      validate: {
        isEmail: true
      }
    },
    recipientEmail: {
      type: DataTypes.STRING(180),
      allowNull: false,
      field: 'recipient_email',
      validate: {
        isEmail: true
      }
    },
    secretExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'secret_expires_at'
    }
  },
  {
    tableName: 'mail_configs',
    underscored: true
  }
);

module.exports = MailConfig;
