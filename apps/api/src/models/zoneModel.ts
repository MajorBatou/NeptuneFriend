import { query, queryOne } from '../db/pool.js';

export interface SailingZone {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  boundsNorth?: number;
  boundsSouth?: number;
  boundsEast?: number;
  boundsWest?: number;
  isActive: boolean;
  createdAt: string;
}

export const ZoneModel = {
  async findAll(): Promise<SailingZone[]> {
    return query<SailingZone>(
      `SELECT id, name, description,
              lat::float, lng::float,
              bounds_north::float as "boundsNorth",
              bounds_south::float as "boundsSouth",
              bounds_east::float  as "boundsEast",
              bounds_west::float  as "boundsWest",
              is_active as "isActive",
              created_at as "createdAt"
       FROM sailing_zones
       WHERE is_active = true
       ORDER BY name`
    );
  },

  async findById(id: string): Promise<SailingZone | null> {
    return queryOne<SailingZone>(
      `SELECT id, name, description,
              lat::float, lng::float,
              bounds_north::float as "boundsNorth",
              bounds_south::float as "boundsSouth",
              bounds_east::float  as "boundsEast",
              bounds_west::float  as "boundsWest",
              is_active as "isActive",
              created_at as "createdAt"
       FROM sailing_zones WHERE id = $1`,
      [id]
    );
  },

  async findNearest(lat: number, lng: number): Promise<SailingZone | null> {
    return queryOne<SailingZone>(
      `SELECT id, name, description,
              lat::float, lng::float,
              is_active as "isActive",
              created_at as "createdAt",
              (point(lng, lat) <-> point($2, $1)) as distance
       FROM sailing_zones
       WHERE is_active = true
       ORDER BY distance
       LIMIT 1`,
      [lat, lng]
    );
  },
};
