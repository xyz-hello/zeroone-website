const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatMessage = sequelize.define(
  'ChatMessage',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    sessionId: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: 'session_id'
    },
    role: {
      type: DataTypes.ENUM('user', 'assistant'),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    matchedKnowledgeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'matched_knowledge_id'
    }
  },
  {
    tableName: 'chat_messages',
    underscored: true
  }
);

module.exports = ChatMessage;
