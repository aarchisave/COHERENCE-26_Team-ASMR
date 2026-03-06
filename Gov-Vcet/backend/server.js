const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/budget', require('./routes/budgetRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/prediction', require('./routes/predictionRoutes'));
app.use('/api/recommendation', require('./routes/recommendationRoutes'));

// Basic health check route
app.get('/', (req, res) => {
  res.send('National Budget Flow Intelligence API is running');
});

// Use custom error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
