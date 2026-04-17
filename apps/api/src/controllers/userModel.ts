import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Use a local pool instance to avoid circular imports
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

async function queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  userId: string;
  units: string;
  windSpeedUnit: string;
  temperatureUnit: string;
  defaultZoom: number;
  notificationsEnabled: boolean;
}

export interface SafeUser extends Omit<User, 'passwordHash'> {
  favoriteZones: string[];
  preferences: UserPreferences;
}

export const UserModel = {
  async findByEmail(email: string): Promise<User | null> {
    return queryOne<User>(
      `SELECT id, name, email, password_hash as "passwordHash", provider,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE email = $1`,
      [email]
    );
  },

  async findById(id: string): Promise<User | null> {
    return queryOne<User>(
      `SELECT id, name, email, provider,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE id = $1`,
      [id]
    );
  },

  async create(data: {
    name: string;
    email: string;
    password: string;
    provider?: string;
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<User>(
        `INSERT INTO users (name, email, password_hash, provider)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, provider,
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [data.name, data.email, passwordHash, data.provider ?? 'local']
      );
      const user = result.rows[0];
      await client.query(`INSERT INTO user_preferences (user_id) VALUES ($1)`, [user.id]);
      await client.query('COMMIT');
      return user;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async verifyPassword(user: User, password: string): Promise<boolean> {
    if (!user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  },

  async getFavoriteZones(userId: string): Promise<string[]> {
    const rows = await query<{ zoneId: string }>(
      `SELECT zone_id as "zoneId" FROM user_favorite_zones WHERE user_id = $1`,
      [userId]
    );
    return rows.map((r) => r.zoneId);
  },

  async getPreferences(userId: string): Promise<UserPreferences | null> {
    return queryOne<UserPreferences>(
      `SELECT user_id as "userId", units, wind_speed_unit as "windSpeedUnit",
              temperature_unit as "temperatureUnit", default_zoom as "defaultZoom",
              notifications_enabled as "notificationsEnabled"
       FROM user_preferences WHERE user_id = $1`,
      [userId]
    );
  },

  async toSafeUser(user: User): Promise<SafeUser> {
    const [favoriteZones, preferences] = await Promise.all([
      UserModel.getFavoriteZones(user.id),
      UserModel.getPreferences(user.id),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return {
      ...safeUser,
      favoriteZones,
      preferences: preferences ?? {
        userId: user.id,
        units: 'nautical',
        windSpeedUnit: 'knots',
        temperatureUnit: 'celsius',
        defaultZoom: 7,
        notificationsEnabled: true,
      },
    };
  },
};
