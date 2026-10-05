const express = require('express');
require('dotenv').config();

const tyreRoutes = require('./routes/tyres');
const evRoutes = require('./routes/ev'); // <-- 1. Add this import

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Routes
app.use('/api/tyres', tyreRoutes);
app.use('/api/ev', evRoutes); // <-- 2. Register EV routes

app.get('/', (req, res) => {
  res.send('Integrated Business DSS API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});