import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  enableOfflineQueue: false,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

redis.on('error', () => {
  // Redis failures are non-fatal — we fall back to live data
});

const CACHE_TTL = {
  conditions: 5 * 60, // 5 minutes
  forecast: 30 * 60, // 30 minutes
  zones: 60 * 60, // 1 hour
};

export const weatherCache = {
  async getConditions(zoneId: string): Promise<string | null> {
    try {
      return await redis.get(`conditions:${zoneId}`);
    } catch {
      return null;
    }
  },

  async setConditions(zoneId: string, data: string): Promise<void> {
    try {
      await redis.setex(`conditions:${zoneId}`, CACHE_TTL.conditions, data);
    } catch {
      // Non-fatal
    }
  },

  async getForecast(zoneId: string, hours: number): Promise<string | null> {
    try {
      return await redis.get(`forecast:${zoneId}:${hours}`);
    } catch {
      return null;
    }
  },

  async setForecast(zoneId: string, hours: number, data: string): Promise<void> {
    try {
      await redis.setex(`forecast:${zoneId}:${hours}`, CACHE_TTL.forecast, data);
    } catch {
      // Non-fatal
    }
  },

  async getZones(): Promise<string | null> {
    try {
      return await redis.get('zones:all');
    } catch {
      return null;
    }
  },

  async setZones(data: string): Promise<void> {
    try {
      await redis.setex('zones:all', CACHE_TTL.zones, data);
    } catch {
      // Non-fatal
    }
  },

  async invalidateZone(zoneId: string): Promise<void> {
    try {
      await redis.del(`conditions:${zoneId}`);
      await redis.del(`forecast:${zoneId}:24`);
      await redis.del(`forecast:${zoneId}:72`);
      await redis.del(`forecast:${zoneId}:168`);
    } catch {
      // Non-fatal
    }
  },
};

export default redis;
