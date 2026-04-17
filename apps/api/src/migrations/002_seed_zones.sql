-- Migration: 002_seed_zones.sql
-- Seeds initial sailing zones around the UK and Ireland

INSERT INTO sailing_zones (id, name, description, lat, lng, bounds_north, bounds_south, bounds_east, bounds_west)
VALUES
  (
    uuid_generate_v4(),
    'Solent',
    'The Solent is a strait between the Isle of Wight and mainland England. Popular sailing destination with regular winds.',
    50.7700, -1.3000,
    50.9000, 50.6000, -1.0000, -1.6000
  ),
  (
    uuid_generate_v4(),
    'Thames Estuary',
    'The tidal river mouth of the Thames. Complex tidal patterns and excellent coastal sailing.',
    51.5000, 0.8000,
    51.7000, 51.3000, 1.2000, 0.3000
  ),
  (
    uuid_generate_v4(),
    'Bristol Channel',
    'Known for having one of the highest tidal ranges in the world. Challenging but rewarding sailing.',
    51.3500, -3.5000,
    51.6000, 51.0000, -2.8000, -4.2000
  ),
  (
    uuid_generate_v4(),
    'Firth of Clyde',
    'Scotland''s premier sailing area with stunning scenery and sheltered waters.',
    55.7000, -4.8000,
    56.0000, 55.4000, -4.3000, -5.3000
  ),
  (
    uuid_generate_v4(),
    'Dublin Bay',
    'Ireland''s capital bay offering varied sailing conditions and easy access to the Irish Sea.',
    53.3200, -6.1000,
    53.4500, 53.1800, -5.9000, -6.3000
  ),
  (
    uuid_generate_v4(),
    'Chichester Harbour',
    'A designated Area of Outstanding Natural Beauty with sheltered waters ideal for all skill levels.',
    50.8200, -0.8800,
    50.9000, 50.7500, -0.7500, -1.0000
  ),
  (
    uuid_generate_v4(),
    'Plymouth Sound',
    'Natural harbour with excellent sailing conditions and historic maritime heritage.',
    50.3500, -4.1500,
    50.4200, 50.2800, -3.9500, -4.3500
  ),
  (
    uuid_generate_v4(),
    'Cardigan Bay',
    'Large bay on the west coast of Wales. Exposed to Atlantic swells with spectacular scenery.',
    52.2500, -4.4000,
    52.8000, 51.6000, -3.8000, -5.0000
  )
ON CONFLICT DO NOTHING;
