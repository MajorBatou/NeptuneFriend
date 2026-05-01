import { Router, Request, Response } from 'express';
import { HISTORICAL_EVENTS, getHistoricalEvent } from '../data/historicalConditions.js';

const router = Router();

// GET /historical — list all historical events
router.get('/', (_req: Request, res: Response) => {
  const events = HISTORICAL_EVENTS.map(
    ({ id, name, date, location, description, coordinates, conditions, casualties }) => ({
      id,
      name,
      date,
      location,
      description,
      coordinates,
      safetyRating: conditions.safetyRating,
      windBeaufort: conditions.wind.beaufort,
      waveHeight: conditions.waves.height,
      casualties,
    })
  );

  return res.json({ data: events, timestamp: new Date().toISOString() });
});

// GET /historical/:id — get full conditions for a specific event
router.get('/:id', (req: Request, res: Response) => {
  const event = getHistoricalEvent(req.params.id);

  if (!event) {
    return res.status(404).json({
      error: 'Not found',
      message: 'Historical event not found',
      statusCode: 404,
      timestamp: new Date().toISOString(),
    });
  }

  return res.json({ data: event, timestamp: new Date().toISOString() });
});

export default router;
