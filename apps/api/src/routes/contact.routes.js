const express = require('express');

const { MailConfig } = require('../models');

const router = express.Router();
const graphBaseUrl = 'https://graph.microsoft.com/v1.0';
const contactCooldownMs = 5 * 60 * 1000;
const contactCooldowns = new Map();

class ContactError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function validatePayload(payload) {
  const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload?.email === 'string' ? payload.email.trim() : '';
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';

  if (!name || !email || !message) {
    throw new ContactError('Please complete your name, email, and message.', 400);
  }

  return {
    name,
    email,
    message
  };
}

function getCooldownKey(req, email) {
  return `${req.ip || req.socket?.remoteAddress || 'unknown'}:${email.toLowerCase()}`;
}

function getCooldownRemainingMs(key) {
  const nextAllowedAt = contactCooldowns.get(key);

  if (!nextAllowedAt) {
    return 0;
  }

  const remainingMs = nextAllowedAt - Date.now();

  if (remainingMs <= 0) {
    contactCooldowns.delete(key);
    return 0;
  }

  return remainingMs;
}

async function getMailConfig() {
  const storedConfig = await MailConfig.findOne({
    order: [['id', 'ASC']]
  });

  return {
    tenantId: storedConfig?.tenantId || process.env.MS_TENANT_ID,
    clientId: storedConfig?.clientId || process.env.MS_CLIENT_ID,
    clientSecret: storedConfig?.clientSecret || process.env.MS_CLIENT_SECRET,
    senderEmail: storedConfig?.senderEmail || process.env.MS_SENDER_EMAIL,
    recipientEmail: storedConfig?.recipientEmail || process.env.MS_RECIPIENT_EMAIL || 'info@zerooneitinc.com'
  };
}

async function getAccessToken(mailConfig) {
  if (!mailConfig.tenantId || !mailConfig.clientId || !mailConfig.clientSecret) {
    throw new ContactError('Server email configuration is incomplete.');
  }

  const body = new URLSearchParams({
    client_id: mailConfig.clientId,
    client_secret: mailConfig.clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await fetch(`https://login.microsoftonline.com/${mailConfig.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  if (!response.ok) {
    throw new ContactError('Microsoft Graph authentication failed.');
  }

  const data = await response.json();
  return data.access_token;
}

async function sendMail({ accessToken, mailConfig, name, email, message }) {
  if (!mailConfig.senderEmail) {
    throw new ContactError('MS_SENDER_EMAIL is missing.');
  }

  const response = await fetch(`${graphBaseUrl}/users/${encodeURIComponent(mailConfig.senderEmail)}/sendMail`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: {
        subject: `New ZeroOne website inquiry from ${name}`,
        body: {
          contentType: 'HTML',
          content: `
            <p>You received a new message from the ZeroOne website.</p>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
          `
        },
        toRecipients: [
          {
            emailAddress: {
              address: mailConfig.recipientEmail
            }
          }
        ],
        replyTo: [
          {
            emailAddress: {
              address: email
            }
          }
        ]
      },
      saveToSentItems: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('Microsoft Graph sendMail failed:', {
      status: response.status,
      body: errorText
    });
    throw new ContactError(`Unable to send email through Microsoft Graph. Status: ${response.status}.`);
  }
}

router.post('/', async (req, res, next) => {
  try {
    const payload = validatePayload(req.body);
    const cooldownKey = getCooldownKey(req, payload.email);
    const cooldownRemainingMs = getCooldownRemainingMs(cooldownKey);

    if (cooldownRemainingMs > 0) {
      res.set('Retry-After', String(Math.ceil(cooldownRemainingMs / 1000)));
      throw new ContactError('Please wait 5 minutes before sending another message.', 429);
    }

    const mailConfig = await getMailConfig();
    const accessToken = await getAccessToken(mailConfig);

    await sendMail({
      accessToken,
      mailConfig,
      ...payload
    });

    contactCooldowns.set(cooldownKey, Date.now() + contactCooldownMs);

    res.json({
      cooldownSeconds: contactCooldownMs / 1000,
      message: 'Thanks. Your message has been sent.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
