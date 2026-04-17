import { Router, Request, Response } from 'express';
import { WeatherAggregator } from '../services/weather/WeatherAggregator.js';
import { weatherCache } from '../services/weather/WeatherCache.js';
import { ZoneModel } from '../models/zoneModel.js';
import { authMiddleware } from '../middleware/auth.js';
import { apiRateLimit } from '../middleware/rateLimit.js';

const router = Router();
const aggregator = new WeatherAggregator();

// GET /weather/zones — all zones with cached conditions
router.get('/zones', async (_req: Request, res: Response) => {
  try {
    // Check cache
    const cached = await weatherCache.getZones();
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const zones = await ZoneModel.findAll();

    // Fetch conditions for all zones in parallel (with timeout)
    const zonesWithConditions = await Promise.all(
      zones.map(async (zone) => {
        try {
          const cachedConditions = await weatherCache.getConditions(zone.id);
          if (cachedConditions) {
            return { ...zone, conditions: JSON.parse(cachedConditions) };
          }

          const conditions = await Promise.race([
            aggregator.getConditions(zone.lat, zone.lng),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
          ]);

          await weatherCache.setConditions(zone.id, JSON.stringify(conditions));
          return { ...zone, conditions };
        } catch {
          return { ...zone, conditions: null };
        }
      })
    );

    const response = {
      data: zonesWithConditions,
      timestamp: new Date().toISOString(),
    };

    await weatherCache.setZones(JSON.stringify(response));
    return res.json(response);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch zones',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /weather/conditions/:zoneId
router.get('/conditions/:zoneId', async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;

    const cached = await weatherCache.getConditions(zoneId);
    if (cached) {
      return res.json({
        data: JSON.parse(cached),
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    const zone = await ZoneModel.findById(zoneId);
    if (!zone) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Zone not found',
        statusCode: 404,
        timestamp: new Date().toISOString(),
      });
    }

    const conditions = await aggregator.getConditions(zone.lat, zone.lng);
    await weatherCache.setConditions(zoneId, JSON.stringify(conditions));

    return res.json({ data: conditions, cached: false, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch conditions',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /weather/forecast/:zoneId?hours=24|72|168
router.get('/forecast/:zoneId', async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;
    const hours = Math.min(Number(req.query.hours) || 24, 168) as 24 | 72 | 168;

    const cached = await weatherCache.getForecast(zoneId, hours);
    if (cached) {
      return res.json({
        data: JSON.parse(cached),
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    const zone = await ZoneModel.findById(zoneId);
    if (!zone) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Zone not found',
        statusCode: 404,
        timestamp: new Date().toISOString(),
      });
    }

    const forecast = await aggregator.getForecast(zone.lat, zone.lng, hours);
    await weatherCache.setForecast(zoneId, hours, JSON.stringify(forecast));

    return res.json({
      data: { zoneId, points: forecast, generatedAt: new Date().toISOString() },
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch forecast',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /weather/nearest?lat=&lng=
router.get('/nearest', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'lat and lng query params required',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }

    const zone = await ZoneModel.findNearest(lat, lng);
    if (!zone) {
      return res.status(404).json({
        error: 'Not found',
        message: 'No zones found',
        statusCode: 404,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({ data: zone, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to find nearest zone',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /weather/conditions/bulk (protected — needs auth)
router.post(
  '/conditions/bulk',
  authMiddleware,
  apiRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { zoneIds } = req.body as { zoneIds: string[] };
      if (!Array.isArray(zoneIds) || zoneIds.length === 0) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'zoneIds array required',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
      }

      const conditions = await Promise.all(
        zoneIds.slice(0, 20).map(async (zoneId) => {
          const cached = await weatherCache.getConditions(zoneId);
          if (cached) return { zoneId, conditions: JSON.parse(cached) };

          const zone = await ZoneModel.findById(zoneId);
          if (!zone) return { zoneId, conditions: null };

          try {
            const conds = await aggregator.getConditions(zone.lat, zone.lng);
            await weatherCache.setConditions(zoneId, JSON.stringify(conds));
            return { zoneId, conditions: conds };
          } catch {
            return { zoneId, conditions: null };
          }
        })
      );

      return res.json({ data: conditions, timestamp: new Date().toISOString() });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Bulk fetch failed',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

export default router;
