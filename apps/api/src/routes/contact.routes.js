const express = require('express');

const router = express.Router();
const graphBaseUrl = 'https://graph.microsoft.com/v1.0';

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

async function getAccessToken() {
  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new ContactError('Server email configuration is incomplete.');
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
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

async function sendMail({ accessToken, name, email, message }) {
  const senderEmail = process.env.MS_SENDER_EMAIL;
  const recipientEmail = process.env.MS_RECIPIENT_EMAIL || 'contact@zeroone-apps.com';

  if (!senderEmail) {
    throw new ContactError('MS_SENDER_EMAIL is missing.');
  }

  const response = await fetch(`${graphBaseUrl}/users/${encodeURIComponent(senderEmail)}/sendMail`, {
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
              address: recipientEmail
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
    throw new ContactError('Unable to send email through Microsoft Graph.');
  }
}

router.post('/', async (req, res, next) => {
  try {
    const payload = validatePayload(req.body);
    const accessToken = await getAccessToken();

    await sendMail({
      accessToken,
      ...payload
    });

    res.json({
      message: 'Thanks. Your message has been sent.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
