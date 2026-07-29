const express = require('express');

const { ChatKnowledge, ChatMessage } = require('../models');

const router = express.Router();
const fallbackAnswer =
  "I don't have a database answer for that yet. Please contact ZeroOne at info@zerooneitinc.com so the team can help you directly.";
const shortTokens = new Set(['hi', 'yo']);
let chatKnowledgeSchema = {
  isChecked: false,
  hasPriority: true,
  hasIsActive: true,
  hasShowInFaq: true
};

async function getChatKnowledgeSchema() {
  if (chatKnowledgeSchema.isChecked) {
    return chatKnowledgeSchema;
  }

  const tableDescription = await ChatKnowledge.describe();
  chatKnowledgeSchema = {
    isChecked: true,
    hasPriority: Boolean(tableDescription.priority),
    hasIsActive: Boolean(tableDescription.isActive || tableDescription.is_active),
    hasShowInFaq: Boolean(tableDescription.showInFaq || tableDescription.show_in_faq)
  };

  return chatKnowledgeSchema;
}

async function ensureChatKnowledgeColumns() {
  const schema = await getChatKnowledgeSchema();

  if (schema.hasPriority && schema.hasIsActive && schema.hasShowInFaq) {
    return schema;
  }

  const queryInterface = ChatKnowledge.sequelize.getQueryInterface();

  if (!schema.hasPriority) {
    await queryInterface.addColumn('chat_knowledge', 'priority', {
      type: ChatKnowledge.rawAttributes.priority.type,
      allowNull: false,
      defaultValue: 10
    });
  }

  if (!schema.hasIsActive) {
    await queryInterface.addColumn('chat_knowledge', 'is_active', {
      type: ChatKnowledge.rawAttributes.isActive.type,
      allowNull: false,
      defaultValue: true
    });
  }

  if (!schema.hasShowInFaq) {
    await queryInterface.addColumn('chat_knowledge', 'show_in_faq', {
      type: ChatKnowledge.rawAttributes.showInFaq.type,
      allowNull: false,
      defaultValue: false
    });
  }

  chatKnowledgeSchema = {
    isChecked: true,
    hasPriority: true,
    hasIsActive: true,
    hasShowInFaq: true
  };

  return chatKnowledgeSchema;
}

async function findActiveKnowledgeRows(options = {}) {
  const schema = await ensureChatKnowledgeColumns();
  const where = {};

  if (schema.hasIsActive) {
    where.isActive = true;
  }

  if (options.faqOnly && schema.hasShowInFaq) {
    where.showInFaq = true;
  }

  return ChatKnowledge.findAll({
    where: Object.keys(where).length ? where : undefined,
    order: schema.hasPriority
      ? [
          ['priority', 'DESC'],
          ['id', 'ASC']
        ]
      : [['id', 'ASC']],
    limit: options.limit
  });
}

function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3 || shortTokens.has(word));
}

function scoreKnowledge(messageTokens, item) {
  const sourceTokens = tokenize(`${item.question || ''} ${item.keywords || ''} ${item.answer || ''}`);
  const source = new Set(sourceTokens);

  const score = messageTokens.reduce((total, token) => total + (source.has(token) ? 1 : 0), 0);

  return score;
}

async function findBestKnowledgeAnswer(message) {
  const messageTokens = tokenize(message);

  if (!messageTokens.length) {
    return null;
  }

  const knowledgeRows = await findActiveKnowledgeRows();

  let bestMatch = null;
  let bestScore = 0;

  for (const item of knowledgeRows) {
    const score = scoreKnowledge(messageTokens, item);

    if (score > bestScore) {
      bestMatch = item;
      bestScore = score;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

router.get('/faqs', async (req, res, next) => {
  try {
    const requestedLimit = Number(req.query?.limit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 12)
      : 5;
    const rows = await findActiveKnowledgeRows({ limit, faqOnly: true });

    return res.json({
      questions: rows.map((row) => ({
        id: row.id,
        question: row.question
      }))
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/message', async (req, res, next) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const sessionId =
      typeof req.body?.sessionId === 'string' && req.body.sessionId.trim()
        ? req.body.sessionId.trim().slice(0, 80)
        : `web-${Date.now()}`;

    if (!message) {
      return res.status(400).json({
        message: 'Message is required.'
      });
    }

    await ChatMessage.create({
      sessionId,
      role: 'user',
      message
    });

    const match = await findBestKnowledgeAnswer(message);
    const answer = match?.answer || fallbackAnswer;

    await ChatMessage.create({
      sessionId,
      role: 'assistant',
      message: answer,
      matchedKnowledgeId: match?.id || null
    });

    return res.json({
      sessionId,
      answer,
      matchedKnowledgeId: match?.id || null
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
