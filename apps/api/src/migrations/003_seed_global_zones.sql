-- Migration: 003_seed_global_zones.sql
-- Adds global sailing zones across US, Caribbean, Australia and New Zealand

-- US East Coast
INSERT INTO sailing_zones (id, name, description, lat, lng, bounds_north, bounds_south, bounds_east, bounds_west)
VALUES
  (
    uuid_generate_v4(),
    'Chesapeake Bay',
    'The largest estuary in the United States. Excellent sailing with consistent winds and protected waters.',
    37.8000, -76.2000,
    39.4000, 36.9000, -75.8000, -77.0000
  ),
  (
    uuid_generate_v4(),
    'Long Island Sound',
    'A sheltered tidal estuary between Connecticut and Long Island. Popular racing and cruising ground.',
    41.1000, -72.8000,
    41.4000, 40.9000, -71.8000, -73.8000
  ),
  (
    uuid_generate_v4(),
    'Cape Cod Bay',
    'Scenic bay on the outer edge of Cape Cod. Excellent summer sailing with sea breezes.',
    41.8000, -70.2000,
    42.1000, 41.5000, -69.8000, -70.7000
  ),
  (
    uuid_generate_v4(),
    'Delaware Bay',
    'Major estuary between Delaware and New Jersey. Strong tidal currents and varied conditions.',
    39.1000, -75.3000,
    39.6000, 38.7000, -74.8000, -75.7000
  ),
  (
    uuid_generate_v4(),
    'Charleston Harbor',
    'Historic South Carolina harbor. Warm water sailing with Atlantic access and barrier islands.',
    32.7800, -79.9500,
    32.9500, 32.6000, -79.7000, -80.1500
  ),
  (
    uuid_generate_v4(),
    'Florida Keys',
    'Island chain extending southwest from Miami. Crystal clear waters and reliable trade winds.',
    24.7000, -81.0000,
    25.2000, 24.4000, -80.0000, -82.0000
  ),

-- US West Coast
  (
    uuid_generate_v4(),
    'San Francisco Bay',
    'World-famous sailing destination with strong afternoon winds and spectacular scenery.',
    37.8000, -122.4000,
    38.1000, 37.4000, -122.0000, -122.8000
  ),
  (
    uuid_generate_v4(),
    'Puget Sound',
    'Deep fjord system in Washington State. Protected waters with stunning mountain backdrop.',
    47.6000, -122.4000,
    48.4000, 47.0000, -122.0000, -122.9000
  ),
  (
    uuid_generate_v4(),
    'Monterey Bay',
    'National Marine Sanctuary with diverse marine life. Excellent coastal sailing and whale watching.',
    36.8000, -121.9000,
    37.1000, 36.5000, -121.6000, -122.2000
  ),
  (
    uuid_generate_v4(),
    'San Diego Bay',
    'Year-round sailing in Southern California sunshine. Protected bay with easy Pacific Ocean access.',
    32.7000, -117.2000,
    32.8000, 32.5500, -117.0500, -117.3000
  ),

-- Gulf of Mexico
  (
    uuid_generate_v4(),
    'Tampa Bay',
    'Florida''s largest open water estuary. Warm year-round sailing with steady sea breezes.',
    27.8000, -82.5000,
    28.1000, 27.4000, -82.1000, -82.9000
  ),
  (
    uuid_generate_v4(),
    'Galveston Bay',
    'Texas Gulf Coast sailing hub. Flat water racing and cruising with access to the Gulf.',
    29.5000, -94.9000,
    29.8000, 29.2000, -94.5000, -95.2000
  ),
  (
    uuid_generate_v4(),
    'New Orleans Coast',
    'Louisiana Gulf Coast. Unique sailing environment with bayous, lakes and Gulf access.',
    29.9000, -89.9000,
    30.2000, 29.5000, -89.5000, -90.3000
  ),

-- Caribbean
  (
    uuid_generate_v4(),
    'Nassau Bahamas',
    'Crystal clear Bahamian waters. Trade wind sailing at its finest with stunning anchorages.',
    25.0500, -77.3500,
    25.3000, 24.7000, -77.0000, -77.7000
  ),
  (
    uuid_generate_v4(),
    'British Virgin Islands',
    'The sailing capital of the Caribbean. Consistent trade winds, protected channels and stunning anchorages.',
    18.4300, -64.6200,
    18.7500, 18.2000, -64.2500, -65.0000
  ),
  (
    uuid_generate_v4(),
    'St Maarten',
    'Dual nationality island at the heart of the Caribbean. Excellent provisioning and vibrant sailing scene.',
    18.0700, -63.0600,
    18.1800, 17.9000, -62.9000, -63.2500
  ),
  (
    uuid_generate_v4(),
    'Barbados',
    'Easternmost Caribbean island. Atlantic swells and trade winds make for exhilarating sailing.',
    13.1700, -59.5500,
    13.4000, 12.9500, -59.3500, -59.7500
  ),
  (
    uuid_generate_v4(),
    'Trinidad and Tobago',
    'Southern Caribbean twin island nation. Rich marine biodiversity and varied sailing conditions.',
    10.6500, -61.2000,
    11.4000, 10.0000, -60.5000, -61.9000
  ),
  (
    uuid_generate_v4(),
    'Turks and Caicos',
    'Pristine coral reefs and turquoise waters. World-class sailing and diving destination.',
    21.7500, -71.7500,
    22.1000, 21.3000, -71.2000, -72.5000
  ),

-- Australia
  (
    uuid_generate_v4(),
    'Sydney Harbour',
    'One of the world''s most beautiful natural harbours. Home to world-class regattas and iconic sailing.',
    -33.8500, 151.2100,
    -33.7000, -34.0000, 151.4000, 151.0000
  ),
  (
    uuid_generate_v4(),
    'Great Barrier Reef',
    'World''s largest coral reef system. Protected lagoon sailing with incredible marine life.',
    -18.0000, 147.5000,
    -14.0000, -22.0000, 149.0000, 146.0000
  ),
  (
    uuid_generate_v4(),
    'Whitsundays',
    '74 islands in the heart of the Great Barrier Reef. Australia''s premier sailing destination.',
    -20.2000, 148.9000,
    -19.8000, -20.6000, 149.3000, 148.5000
  ),
  (
    uuid_generate_v4(),
    'Port Phillip Bay',
    'Large sheltered bay near Melbourne. Victoria''s sailing hub with diverse conditions.',
    -38.0000, 144.8000,
    -37.8000, -38.5000, 145.3000, 144.3000
  ),
  (
    uuid_generate_v4(),
    'Fremantle',
    'Western Australia''s sailing capital. Famous Fremantle Doctor sea breeze provides world-class conditions.',
    -32.0500, 115.7500,
    -31.7000, -32.4000, 116.0000, 115.4000
  ),
  (
    uuid_generate_v4(),
    'Darwin Harbour',
    'Northern Territory tropical sailing. Dramatic tidal ranges and unique Top End experience.',
    -12.4500, 130.8500,
    -12.2000, -12.7000, 131.1000, 130.6000
  ),

-- New Zealand
  (
    uuid_generate_v4(),
    'Hauraki Gulf',
    'Auckland''s sailing playground. Over 50 islands with sheltered waters and consistent winds.',
    -36.6000, 175.1000,
    -36.0000, -37.2000, 175.8000, 174.5000
  ),
  (
    uuid_generate_v4(),
    'Marlborough Sounds',
    'Drowned river valleys creating hundreds of kilometres of sheltered waterways. Stunning scenery.',
    -41.1000, 174.0000,
    -40.7000, -41.5000, 174.5000, 173.5000
  ),
  (
    uuid_generate_v4(),
    'Bay of Islands',
    'Northland''s cruising paradise. 144 islands with clear water, sandy beaches and reliable winds.',
    -35.2000, 174.1000,
    -34.9000, -35.5000, 174.5000, 173.7000
  ),
  (
    uuid_generate_v4(),
    'Wellington Harbour',
    'Cook Strait sailing in New Zealand''s windiest city. Challenging conditions for experienced sailors.',
    -41.2800, 174.7700,
    -41.1500, -41.4000, 174.9500, 174.6000
  )
ON CONFLICT DO NOTHING;
