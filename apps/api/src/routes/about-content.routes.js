const express = require('express');
const fs = require('fs/promises');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');

const { appConfig } = require('../config/env');
const { requireAuth, requireRole, roles } = require('../middleware/auth');
const { AboutContent } = require('../models');

const router = express.Router();
const teamPhotoUploadMaxBytes = Math.max(appConfig.teamPhotoUploadMaxMb, 1) * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: teamPhotoUploadMaxBytes
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Please upload an image file.'));
      return;
    }

    callback(null, true);
  }
});
const teamUploadDir = path.join(__dirname, '..', '..', 'uploads', 'team');
const legacyTeamUploadDir = path.join(__dirname, '..', 'uploads', 'team');

function serialize(row) {
  return {
    sectionId: row.sectionId,
    content: row.content
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function deleteUploadedTeamPhoto(photoUrl) {
  if (typeof photoUrl !== 'string' || !photoUrl.startsWith('/api/uploads/team/')) {
    return false;
  }

  const filename = path.basename(photoUrl);

  if (!filename || filename !== photoUrl.replace('/api/uploads/team/', '')) {
    return false;
  }

  try {
    await fs.unlink(path.join(teamUploadDir, filename));
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  try {
    await fs.unlink(path.join(legacyTeamUploadDir, filename));
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

router.get('/', async (req, res, next) => {
  try {
    const rows = await AboutContent.findAll({
      order: [['sectionId', 'ASC']]
    });

    return res.json({
      sections: rows.map(serialize)
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/admin', requireAuth, requireRole([roles.SUPERADMIN, roles.ADMIN]), async (req, res, next) => {
  try {
    const rows = await AboutContent.findAll({
      order: [['sectionId', 'ASC']]
    });

    return res.json({
      sections: rows.map(serialize)
    });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/admin/team-photo',
  requireAuth,
  requireRole([roles.SUPERADMIN, roles.ADMIN]),
  upload.single('photo'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: 'Team photo is required.'
        });
      }

      await fs.mkdir(teamUploadDir, { recursive: true });

      const filename = `team-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      const outputPath = path.join(teamUploadDir, filename);

      await sharp(req.file.buffer)
        .rotate()
        .resize(900, 900, {
          fit: 'cover',
          position: 'attention'
        })
        .webp({
          quality: 82
        })
        .toFile(outputPath);

      return res.status(201).json({
        message: 'Team photo uploaded.',
        url: `/api/uploads/team/${filename}`
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.delete('/admin/team-photo', requireAuth, requireRole([roles.SUPERADMIN, roles.ADMIN]), async (req, res, next) => {
  try {
    const deleted = await deleteUploadedTeamPhoto(req.body?.url);

    return res.json({
      message: deleted ? 'Team photo deleted.' : 'No uploaded team photo was deleted.',
      deleted
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/admin/:sectionId', requireAuth, requireRole([roles.SUPERADMIN, roles.ADMIN]), async (req, res, next) => {
  try {
    const sectionId = String(req.params.sectionId || '').trim();
    const content = req.body?.content;

    if (!sectionId) {
      return res.status(400).json({
        message: 'Section ID is required.'
      });
    }

    if (!isPlainObject(content)) {
      return res.status(400).json({
        message: 'Section content must be an object.'
      });
    }

    const [row] = await AboutContent.upsert(
      {
        sectionId,
        content
      },
      {
        returning: true
      }
    );

    const savedRow = row || await AboutContent.findOne({ where: { sectionId } });

    return res.json({
      message: 'About content section saved.',
      section: serialize(savedRow)
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
