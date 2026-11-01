const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tyreRoutes = require('./routes/tyres');
const evRoutes = require('./routes/ev');
const fleetRoutes = require('./routes/fleet');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tyres', tyreRoutes);
app.use('/api/ev', evRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.send('Integrated Business DSS API is running...');
});

// Local Development Execution
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Vercel Serverless Export
module.exports = app;