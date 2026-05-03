import { Router, Request, Response } from 'express';
import { getMarineData } from '../services/weather/MarineEnhancer.js';
import { ZoneModel } from '../models/zoneModel.js';

const router = Router();

// GET /marine/:zoneId — get marine conditions for a zone
router.get('/:zoneId', async (req: Request, res: Response) => {
  try {
    const zone = await ZoneModel.findById(req.params.zoneId);
    if (!zone) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Zone not found',
        statusCode: 404,
        timestamp: new Date().toISOString(),
      });
    }

    const marine = await getMarineData(zone.lat, zone.lng);

    if (!marine) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Marine data not available for this location',
        statusCode: 503,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({ data: marine, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch marine conditions',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /marine/coords?lat=&lng= — get marine conditions by coordinates
router.get('/', async (req: Request, res: Response) => {
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

    const marine = await getMarineData(lat, lng);

    if (!marine) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Marine data not available for this location',
        statusCode: 503,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({ data: marine, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch marine conditions',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
