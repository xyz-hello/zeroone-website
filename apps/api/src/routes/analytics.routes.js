const express = require('express');
const { Op } = require('sequelize');

const { requireAuth, requireRole, roles } = require('../middleware/auth');
const { PageVisit } = require('../models');

const router = express.Router();
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

function cleanIp(value) {
  const ip = String(value || '')
    .split(',')[0]
    .trim()
    .replace(/^::ffff:/, '');

  return ip || 'unknown';
}

function getClientIp(req) {
  return cleanIp(
    req.get('cf-connecting-ip') ||
      req.get('x-forwarded-for') ||
      req.get('x-real-ip') ||
      req.socket?.remoteAddress ||
      req.ip
  );
}

function getCountry(req) {
  const headerValue =
    req.get('cf-ipcountry') ||
    req.get('x-vercel-ip-country') ||
    req.get('x-country-code') ||
    req.get('cloudfront-viewer-country');
  const countryCode = typeof headerValue === 'string' ? headerValue.trim().toUpperCase() : '';

  if (!countryCode || countryCode === 'XX' || countryCode.length !== 2) {
    return {
      countryCode: null,
      countryName: null
    };
  }

  return {
    countryCode,
    countryName: countryNames.of(countryCode) || countryCode
  };
}

function parseDevice(userAgent) {
  const value = String(userAgent || '').toLowerCase();

  if (/bot|crawler|spider|slurp|bingpreview/.test(value)) {
    return 'Bot';
  }

  if (/ipad|tablet/.test(value)) {
    return 'Tablet';
  }

  if (/mobi|android|iphone|ipod/.test(value)) {
    return 'Mobile';
  }

  return 'Desktop';
}

function parseBrowser(userAgent) {
  const value = String(userAgent || '');

  if (/Edg\//.test(value)) {
    return 'Microsoft Edge';
  }

  if (/OPR\//.test(value)) {
    return 'Opera';
  }

  if (/Chrome\//.test(value) && !/Chromium\//.test(value)) {
    return 'Chrome';
  }

  if (/Firefox\//.test(value)) {
    return 'Firefox';
  }

  if (/Safari\//.test(value) && !/Chrome\//.test(value)) {
    return 'Safari';
  }

  if (/bot|crawler|spider|slurp/i.test(value)) {
    return 'Bot';
  }

  return 'Unknown';
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getDayKeys(days) {
  const keys = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    keys.push(toDateKey(date));
  }

  return keys;
}

function getPercentChange(current, previous) {
  if (!previous && !current) {
    return 0;
  }

  if (!previous) {
    return 100;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function summarize(rows, dayKeys) {
  const uniqueIps = new Set();
  const perDay = new Map(dayKeys.map((key) => [key, { pageViews: 0, uniqueIps: new Set() }]));

  rows.forEach((row) => {
    const plainRow = row.get({ plain: true });
    const createdAt = new Date(plainRow.createdAt);
    const key = toDateKey(createdAt);

    uniqueIps.add(plainRow.ipAddress);

    if (perDay.has(key)) {
      const day = perDay.get(key);
      day.pageViews += 1;
      day.uniqueIps.add(plainRow.ipAddress);
    }
  });

  return {
    pageViews: rows.length,
    uniqueVisits: uniqueIps.size,
    days: dayKeys.map((key) => ({
      date: key,
      pageViews: perDay.get(key)?.pageViews || 0,
      uniqueVisits: perDay.get(key)?.uniqueIps.size || 0
    }))
  };
}

router.post('/track', async (req, res, next) => {
  try {
    const path = typeof req.body?.path === 'string' ? req.body.path.trim().slice(0, 255) : '/';

    if (path.startsWith('/admin')) {
      return res.status(204).end();
    }

    const userAgent = req.get('user-agent') || '';
    const country = getCountry(req);

    await PageVisit.create({
      ipAddress: getClientIp(req),
      path: path || '/',
      countryCode: country.countryCode,
      countryName: country.countryName,
      device: parseDevice(userAgent),
      browser: parseBrowser(userAgent),
      userAgent
    });

    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

router.get('/admin/traffic', requireAuth, requireRole([roles.SUPERADMIN, roles.ADMIN]), async (req, res, next) => {
  try {
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(now.getDate() - 30);
    const previousStart = new Date(now);
    previousStart.setDate(now.getDate() - 60);

    const [currentRows, previousRows, latestRows] = await Promise.all([
      PageVisit.findAll({
        where: {
          createdAt: {
            [Op.gte]: currentStart
          }
        },
        order: [['createdAt', 'ASC']]
      }),
      PageVisit.findAll({
        where: {
          createdAt: {
            [Op.gte]: previousStart,
            [Op.lt]: currentStart
          }
        }
      }),
      PageVisit.findAll({
        where: {
          createdAt: {
            [Op.gte]: currentStart
          }
        },
        order: [['createdAt', 'DESC']],
        limit: 60
      })
    ]);

    const dayKeys = getDayKeys(30);
    const current = summarize(currentRows, dayKeys);
    const previous = summarize(previousRows, []);

    return res.json({
      summary: {
        uniqueVisits: current.uniqueVisits,
        pageViews: current.pageViews,
        uniqueVisitsChange: getPercentChange(current.uniqueVisits, previous.uniqueVisits),
        pageViewsChange: getPercentChange(current.pageViews, previous.pageViews)
      },
      days: current.days,
      visits: latestRows.map((row) => {
        const plainRow = row.get({ plain: true });

        return {
          id: plainRow.id,
          ipAddress: plainRow.ipAddress,
          path: plainRow.path,
          countryCode: plainRow.countryCode,
          countryName: plainRow.countryName,
          device: plainRow.device,
          browser: plainRow.browser,
          visitedAt: plainRow.createdAt
        };
      })
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
