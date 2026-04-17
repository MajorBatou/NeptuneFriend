-- Migration: 001_initial_schema.sql
-- Creates all core NeptuneFriend tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  avatar_url  VARCHAR(500),
  provider    VARCHAR(20) NOT NULL DEFAULT 'local', -- local, google, facebook
  provider_id VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  units                VARCHAR(20) NOT NULL DEFAULT 'nautical',
  wind_speed_unit      VARCHAR(10) NOT NULL DEFAULT 'knots',
  temperature_unit     VARCHAR(15) NOT NULL DEFAULT 'celsius',
  default_zoom         INTEGER NOT NULL DEFAULT 7,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sailing zones table
CREATE TABLE IF NOT EXISTS sailing_zones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  lat         DECIMAL(9,6) NOT NULL,
  lng         DECIMAL(9,6) NOT NULL,
  bounds_north DECIMAL(9,6),
  bounds_south DECIMAL(9,6),
  bounds_east  DECIMAL(9,6),
  bounds_west  DECIMAL(9,6),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zones_location ON sailing_zones(lat, lng);

-- User favorite zones
CREATE TABLE IF NOT EXISTS user_favorite_zones (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  zone_id    UUID NOT NULL REFERENCES sailing_zones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, zone_id)
);

-- Sailing routes table
CREATE TABLE IF NOT EXISTS sailing_routes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             VARCHAR(200) NOT NULL,
  total_distance   DECIMAL(10,2) NOT NULL DEFAULT 0,
  estimated_time   DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routes_user ON sailing_routes(user_id);

-- Route waypoints table
CREATE TABLE IF NOT EXISTS route_waypoints (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id   UUID NOT NULL REFERENCES sailing_routes(id) ON DELETE CASCADE,
  name       VARCHAR(200),
  lat        DECIMAL(9,6) NOT NULL,
  lng        DECIMAL(9,6) NOT NULL,
  position   INTEGER NOT NULL, -- order of waypoint in route
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_waypoints_route ON route_waypoints(route_id, position);

-- Alert configurations table
CREATE TABLE IF NOT EXISTS alert_configs (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  zone_id   UUID NOT NULL REFERENCES sailing_zones(id) ON DELETE CASCADE,
  type      VARCHAR(20) NOT NULL, -- wind, wave, storm, fog, custom
  threshold DECIMAL(10,2) NOT NULL,
  enabled   BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alert_configs_user ON alert_configs(user_id);
CREATE INDEX idx_alert_configs_zone ON alert_configs(zone_id);

-- Alert history table
CREATE TABLE IF NOT EXISTS alerts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  zone_id      UUID NOT NULL REFERENCES sailing_zones(id),
  type         VARCHAR(20) NOT NULL,
  severity     VARCHAR(10) NOT NULL, -- info, warning, critical
  threshold    DECIMAL(10,2) NOT NULL,
  message      TEXT NOT NULL,
  read         BOOLEAN NOT NULL DEFAULT false,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_user ON alerts(user_id, triggered_at DESC);
CREATE INDEX idx_alerts_unread ON alerts(user_id, read) WHERE read = false;

-- Weather conditions cache table
CREATE TABLE IF NOT EXISTS weather_cache (
  zone_id      UUID NOT NULL REFERENCES sailing_zones(id) ON DELETE CASCADE,
  data         JSONB NOT NULL,
  fetched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (zone_id)
);

CREATE INDEX idx_weather_cache_expires ON weather_cache(expires_at);

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER routes_updated_at
  BEFORE UPDATE ON sailing_routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
