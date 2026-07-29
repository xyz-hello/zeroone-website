const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const { sequelize } = require('../config/database');
const { ChatKnowledge } = require('../models');

const seededKnowledgePriority = 10;
const frequentlyAskedTitles = new Set(['Company Overview', 'Services', 'Contact', 'Location', 'Project Start']);
const knowledgeEntries = [
  {
    title: 'Greeting',
    question: 'Hi, hello, or good morning',
    answer:
      'Hello! I can help answer questions about ZeroOne services, starting a project, contact details, and company information.',
    keywords: 'hi hello hey yo yow greetings good morning afternoon evening kumusta'
  },
  {
    title: 'Thanks',
    question: 'Thank you',
    answer: 'You are welcome! Let me know if you have another question about ZeroOne.',
    keywords: 'thanks thank you appreciate grateful'
  },
  {
    title: 'Help',
    question: 'How can you help me?',
    answer:
      'I can help with:\n- Explaining ZeroOne services\n- Starting a project inquiry\n- Sharing contact details\n- Answering company information\n- Introducing the ZeroOne team\n- Explaining service details like custom software, AI automation, internal systems, web platforms, mobile apps, and workflow solutions',
    keywords:
      'help assist support guide what can you do how can you help need help questions options capabilities'
  },
  {
    title: 'Company Overview',
    question: 'What is ZeroOne IT Inc?',
    answer:
      'ZeroOne IT Inc. was established in May 2026. The company builds modern websites, internal systems, custom software, SaaS platforms, and workflow tools for businesses.',
    keywords: 'zeroone company about overview business software websites systems saas established founded may 2026'
  },
  {
    title: 'Established Date',
    question: 'When was ZeroOne established?',
    answer: 'ZeroOne IT Inc. was established in May 2026.',
    keywords: 'established founded started incorporated launch launched year date may 2026'
  },
  {
    title: 'Services',
    question: 'What services does ZeroOne offer?',
    answer:
      'ZeroOne offers:\n- Custom software development\n- AI automation\n- Internal systems\n- Web platforms\n- Mobile apps\n- Business workflow solutions',
    keywords: 'services offer list custom software ai automation internal systems web platform mobile apps'
  },
  {
    title: 'Service - Custom Software Development',
    question: 'What is custom software development?',
    answer:
      'Custom software development means building software around your exact business process instead of forcing your team to fit into generic tools. ZeroOne can create tailored systems such as booking platforms, inventory tools, dashboards, portals, CRMs, and workflow apps.',
    keywords:
      'custom software development tailored business process exact generic tools booking inventory dashboards portals crm workflow apps'
  },
  {
    title: 'Service - AI Automation',
    question: 'What is AI automation?',
    answer:
      'AI automation helps reduce repetitive manual work by using smart workflows, chat assistants, document processing, lead handling, reporting, and task automation. ZeroOne designs AI-powered tools that support your team and make daily operations faster.',
    keywords:
      'ai automation artificial intelligence smart workflows chatbot assistant document processing lead handling reporting repetitive manual tasks operations'
  },
  {
    title: 'Service - Internal Systems',
    question: 'What are internal systems?',
    answer:
      'Internal systems are private tools used by your staff to manage operations, records, approvals, reports, customers, inventory, branches, or departments. ZeroOne builds secure systems that organize work and help teams move with less confusion.',
    keywords:
      'internal systems private staff operations records approvals reports customers inventory branches departments secure organize teams'
  },
  {
    title: 'Service - Web Platforms',
    question: 'What are web platforms?',
    answer:
      'Web platforms are browser-based products that users can access online, such as customer portals, admin dashboards, SaaS tools, marketplaces, booking systems, and company websites. ZeroOne builds responsive, scalable web platforms for real business use.',
    keywords:
      'web platforms browser online customer portal admin dashboard saas marketplace booking system website responsive scalable'
  },
  {
    title: 'Service - Mobile Apps',
    question: 'What mobile apps can ZeroOne build?',
    answer:
      'ZeroOne can build mobile apps for customer engagement, business operations, booking, ordering, tracking, reporting, and internal team workflows. The goal is to give users a simple app experience while keeping the backend reliable and maintainable.',
    keywords:
      'mobile apps android ios customer engagement operations booking ordering tracking reporting internal team workflows backend'
  },
  {
    title: 'Service - Business Workflow Solutions',
    question: 'What are business workflow solutions?',
    answer:
      'Business workflow solutions connect the steps in your daily operations so work moves from request to approval, assignment, tracking, and reporting with fewer manual handoffs. ZeroOne helps turn messy processes into clear digital workflows.',
    keywords:
      'business workflow solutions process request approval assignment tracking reporting manual handoffs digital workflows operations'
  },
  {
    title: 'Contact',
    question: 'How can I contact ZeroOne?',
    answer:
      'You can contact ZeroOne by email at info@zerooneitinc.com or by phone at +63 919 079 7137.',
    keywords: 'contact email phone call reach support inquiry'
  },
  {
    title: 'Location',
    question: 'Where is ZeroOne based?',
    answer: 'ZeroOne IT Inc. is based in the Philippines.',
    keywords: 'location based philippines office country'
  },
  {
    title: 'Team',
    question: 'Who is on the ZeroOne team?',
    answer:
      'The ZeroOne IT Inc. team includes:\n- Paul John Peligro (PJ): Chief Executive Officer (CEO), Senior Lead Software Developer, and IT Consultant\n- Alriza Palahuddin (Riza): Account Manager, Desktop Engineer, and Software Developer\n- Al Khalid Palahuddin (AL): Business Development Officer (BDO) and Mid-Level Software Developer\n- Hassan: Client Relations and Business Development Partner',
    keywords:
      'team members people staff leadership positions roles pj paul john peligro riza alriza palahuddin al khalid hassan ceo developer consultant account manager desktop engineer bdo business development client relations partner'
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
    const seededEntry = {
      ...entry,
      priority: seededKnowledgePriority,
      isActive: true,
      showInFaq: frequentlyAskedTitles.has(entry.title)
    };
    const [record, created] = await ChatKnowledge.findOrCreate({
      where: {
        title: entry.title
      },
      defaults: seededEntry
    });

    if (!created) {
      await record.update(seededEntry);
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
