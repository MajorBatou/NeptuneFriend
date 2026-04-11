import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'neptunefriend-api', timestamp: new Date().toISOString() });
});

app.get('/weather/conditions', (_req, res) => {
  res.json({ message: 'Weather conditions endpoint — Day 3 implementation' });
});

app.get('/weather/forecast', (_req, res) => {
  res.json({ message: 'Forecast endpoint — Day 3 implementation' });
});

app.listen(PORT, () => {
  console.info(`NeptuneFriend API running on port ${PORT}`);
});

export default app;
