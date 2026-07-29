const express = require('express');

const { requireAuth, requireRole, roles } = require('../middleware/auth');
const { ChatKnowledge } = require('../models');

const router = express.Router();
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

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }

  return Boolean(value);
}

function serializeKnowledge(row) {
  const plainRow = typeof row.get === 'function' ? row.get({ plain: true }) : row;

  return {
    id: plainRow.id,
    title: plainRow.title,
    question: plainRow.question,
    answer: plainRow.answer,
    keywords: plainRow.keywords,
    priority: plainRow.priority,
    isActive: normalizeBoolean(plainRow.isActive),
    showInFaq: normalizeBoolean(plainRow.showInFaq),
    createdAt: plainRow.createdAt,
    updatedAt: plainRow.updatedAt
  };
}

function getKnowledgePayload(body = {}) {
  const question = cleanString(body.question);

  return {
    title: cleanString(body.title) || question.slice(0, 160) || 'Chat Knowledge',
    question,
    answer: cleanString(body.answer),
    keywords: cleanString(body.keywords),
    priority: Number.isInteger(Number(body.priority)) ? Number(body.priority) : 0,
    isActive: body.isActive === undefined ? true : normalizeBoolean(body.isActive),
    showInFaq: body.showInFaq === undefined ? false : normalizeBoolean(body.showInFaq)
  };
}

router.use(requireAuth, requireRole([roles.SUPERADMIN, roles.ADMIN]));

router.get('/', async (req, res, next) => {
  try {
    const schema = await ensureChatKnowledgeColumns();
    const rows = await ChatKnowledge.findAll({
      order: schema.hasPriority
        ? [
            ['priority', 'DESC'],
            ['id', 'ASC']
          ]
        : [['id', 'ASC']]
    });

    return res.json({
      entries: rows.map(serializeKnowledge)
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    await ensureChatKnowledgeColumns();
    const payload = getKnowledgePayload(req.body);

    if (!payload.question || !payload.answer || !payload.keywords) {
      return res.status(400).json({
        message: 'Question, answer, and keywords are required.'
      });
    }

    const entry = await ChatKnowledge.create(payload);

    return res.status(201).json({
      message: 'Knowledge base entry created.',
      entry: serializeKnowledge(entry)
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    await ensureChatKnowledgeColumns();
    const entry = await ChatKnowledge.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({
        message: 'Knowledge base entry not found.'
      });
    }

    const payload = getKnowledgePayload(req.body);

    if (!payload.question || !payload.answer || !payload.keywords) {
      return res.status(400).json({
        message: 'Question, answer, and keywords are required.'
      });
    }

    await entry.update(payload);

    return res.json({
      message: 'Knowledge base entry saved.',
      entry: serializeKnowledge(entry)
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const entry = await ChatKnowledge.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({
        message: 'Knowledge base entry not found.'
      });
    }

    await entry.destroy();

    return res.json({
      message: 'Knowledge base entry deleted.'
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
