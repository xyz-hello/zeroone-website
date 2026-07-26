const { DataTypes } = require('sequelize');

const { sequelize } = require('../config/database');

const AboutContent = sequelize.define(
  'AboutContent',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    sectionId: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      field: 'section_id'
    },
    content: {
      type: DataTypes.JSON,
      allowNull: false
    }
  },
  {
    tableName: 'about_contents',
    underscored: true
  }
);

module.exports = AboutContent;
