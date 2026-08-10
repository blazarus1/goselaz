const path = require('node:path');
const express = require('express');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

const { initializeDatabase } = require('./db/init');
const localDataRouter = require('./routes/localData');
const weatherRouter = require('./routes/weather');
const sportsRouter = require('./routes/sports');
const googleAuthRouter = require('./routes/googleAuth');
const calendarRouter = require('./routes/calendar');

const app = express();
const PORT = process.env.PORT || 3000;

initializeDatabase();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'pi-dashboard-api',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', localDataRouter);
app.use('/api', weatherRouter);
app.use('/api', sportsRouter);
app.use(googleAuthRouter);
app.use('/api', calendarRouter);


app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Pi Dashboard API running at http://localhost:${PORT}`);
});