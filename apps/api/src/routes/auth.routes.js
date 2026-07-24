const express = require('express');
const jwt = require('jsonwebtoken');

const { User } = require('../models');
const { verifyPassword } = require('../utils/password');

const router = express.Router();

const roleLabels = {
  0: 'superadmin',
  1: 'admin'
};

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is missing.');
    error.statusCode = 500;
    throw error;
  }

  return process.env.JWT_SECRET;
}

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    const user = await User.findOne({
      where: {
        email
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    if (user.role !== 1) {
      return res.status(403).json({
        message: 'This login is only available for admin accounts.'
      });
    }

    const passwordMatches = await verifyPassword(password, user.passwordSalt, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        email: user.email
      },
      getJwtSecret(),
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
      }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleName: roleLabels[user.role]
      }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
