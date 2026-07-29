const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PageVisit = sequelize.define(
  'PageVisit',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    ipAddress: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: 'ip_address'
    },
    path: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    countryCode: {
      type: DataTypes.STRING(8),
      allowNull: true,
      field: 'country_code'
    },
    countryName: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'country_name'
    },
    device: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'Desktop'
    },
    browser: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'Unknown'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    }
  },
  {
    tableName: 'page_visits',
    underscored: true
  }
);

module.exports = PageVisit;
