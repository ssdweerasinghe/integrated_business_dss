const express = require('express');
require('dotenv').config();

const tyreRoutes = require('./routes/tyres');
const evRoutes = require('./routes/ev');
const fleetRoutes = require('./routes/fleet');
const analyticsRoutes = require('./routes/analytics'); // <-- 1. Import

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Routes
app.use('/api/tyres', tyreRoutes);
app.use('/api/ev', evRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/analytics', analyticsRoutes); // <-- 2. Register

app.get('/', (req, res) => {
  res.send('Integrated Business DSS API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});