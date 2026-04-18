import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import authRoutes from './routes/auth.js';
import weatherRoutes from './routes/weather.js';
import { apiRateLimit } from './middleware/rateLimit.js';
import { metricsMiddleware, getMetrics } from './middleware/metrics.js';
import { checkConnection } from './db/pool.js';

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
app.use(metricsMiddleware);
app.use(apiRateLimit);

// Health check
app.get('/health', async (_req, res) => {
  const dbConnected = await checkConnection();
  res.json({
    status: dbConnected ? 'ok' : 'degraded',
    service: 'neptunefriend-api',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Prometheus metrics endpoint
app.get('/metrics', (_req, res) => {
  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(getMetrics());
});

app.use('/auth', authRoutes);
app.use('/weather', weatherRoutes);

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
  console.info(`Metrics available at http://localhost:${PORT}/metrics`);
});

export default app;
