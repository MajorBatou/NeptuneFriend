import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import authRoutes from './routes/auth';
import { apiRateLimit } from './middleware/rateLimit';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(apiRateLimit);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'neptunefriend-api',
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRoutes);

app.get('/weather/conditions', (_req, res) => {
  res.json({ message: 'Weather conditions endpoint — coming soon' });
});

app.get('/weather/forecast', (_req, res) => {
  res.json({ message: 'Forecast endpoint — coming soon' });
});

app.use((_req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    statusCode: 404,
    timestamp: new Date().toISOString(),
  });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    statusCode: 500,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.info(`NeptuneFriend API running on port ${PORT}`);
});

export default app;
