const express = require('express');

const { ChatKnowledge, ChatMessage } = require('../models');

const router = express.Router();
const fallbackAnswer =
  "I don't have a database answer for that yet. Please contact ZeroOne at contact@zeroone-apps.com so the team can help you directly.";

function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3);
}

function scoreKnowledge(messageTokens, item) {
  const sourceTokens = tokenize(`${item.title} ${item.question} ${item.keywords || ''}`);
  const source = new Set(sourceTokens);

  return messageTokens.reduce((score, token) => score + (source.has(token) ? 1 : 0), 0);
}

async function findBestKnowledgeAnswer(message) {
  const messageTokens = tokenize(message);

  if (!messageTokens.length) {
    return null;
  }

  const knowledgeRows = await ChatKnowledge.findAll({
    where: {
      isActive: true
    },
    order: [['id', 'ASC']]
  });

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
