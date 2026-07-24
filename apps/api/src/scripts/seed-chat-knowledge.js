const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const { sequelize } = require('../config/database');
const { ChatKnowledge } = require('../models');

const knowledgeEntries = [
  {
    title: 'Company Overview',
    question: 'What is ZeroOne IT Inc?',
    answer:
      'ZeroOne IT Inc. builds modern websites, internal systems, custom software, SaaS platforms, and workflow tools for businesses.',
    keywords: 'zeroone company about overview business software websites systems saas'
  },
  {
    title: 'Services',
    question: 'What services does ZeroOne offer?',
    answer:
      'ZeroOne offers custom software development, AI automation, internal systems, web platforms, mobile apps, and business workflow solutions.',
    keywords: 'services offer custom software ai automation internal systems web platform mobile apps'
  },
  {
    title: 'Contact',
    question: 'How can I contact ZeroOne?',
    answer:
      'You can contact ZeroOne by email at contact@zeroone-apps.com or by phone at +63 919 079 7137.',
    keywords: 'contact email phone call reach support inquiry'
  },
  {
    title: 'Location',
    question: 'Where is ZeroOne based?',
    answer: 'ZeroOne IT Inc. is based in the Philippines.',
    keywords: 'location based philippines office country'
  },
  {
    title: 'Project Start',
    question: 'How do I start a project?',
    answer:
      'To start a project, send your name, email, and project details through the contact form. The team will review your inquiry and respond directly.',
    keywords: 'start project begin quote proposal contact form inquiry'
  }
];

async function seedChatKnowledge() {
  await sequelize.authenticate();

  for (const entry of knowledgeEntries) {
    const [record, created] = await ChatKnowledge.findOrCreate({
      where: {
        title: entry.title
      },
      defaults: entry
    });

    if (!created) {
      await record.update(entry);
    }
  }

  console.log(`Seeded ${knowledgeEntries.length} chat knowledge entries.`);
}

if (require.main === module) {
  seedChatKnowledge()
    .catch((error) => {
      console.error('Chat knowledge seed failed:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sequelize.close().catch(() => {});
    });
}

module.exports = {
  seedChatKnowledge
};
