const express = require('express');
const cors = require('cors');
require('dotenv').config();

const tyreRoutes = require('./routes/tyres');
const evRoutes = require('./routes/ev');
const fleetRoutes = require('./routes/fleet');
const analyticsRoutes = require('./routes/analytics');
const authRoutes = require('./routes/auth'); // <-- 1. Import auth routes

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); // <-- 2. Register auth route
app.use('/api/tyres', tyreRoutes);
app.use('/api/ev', evRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.send('Integrated Business DSS API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});