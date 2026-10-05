const express = require('express');
require('dotenv').config();

const tyreRoutes = require('./routes/tyres');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Routes
app.use('/api/tyres', tyreRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Integrated Business DSS API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});