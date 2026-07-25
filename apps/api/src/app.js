const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const contactRoutes = require('./routes/contact.routes');
const healthRoutes = require('./routes/health.routes');
const mailConfigRoutes = require('./routes/mail-config.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin/mail-config', mailConfigRoutes);
app.use('/api/health', healthRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found.'
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || 'Something went wrong.'
  });
});

module.exports = app;
