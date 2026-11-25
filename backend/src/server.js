require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donors');
const slotRoutes = require('./routes/slots');
const appointmentRoutes = require('./routes/appointments');
const schedulerRoutes = require('./routes/scheduler');
const compatibilityRoutes = require('./routes/compatibility');
const inventoryRoutes = require('./routes/inventory');
const requestRoutes = require('./routes/requests');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/compatibility', compatibilityRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);

const path = require('path');
const fs = require('fs');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static build if available
const distPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Blood Bank Backend running on port ${PORT}`);
  console.log(`Scheduler Engine: ${process.env.SCHEDULER_ENGINE_URL}`);
  console.log(`Compatibility Engine: ${process.env.COMPATIBILITY_ENGINE_URL}`);
});

module.exports = app;
