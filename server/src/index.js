const express = require('express');
const { initializeDatabase } = require('./db/init');
const localDataRouter = require('./routes/localData');

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

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Pi Dashboard API running at http://localhost:${PORT}`);
});