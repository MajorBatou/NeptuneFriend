import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const weatherLatency = new Trend('weather_latency', true);
const authLatency = new Trend('auth_latency', true);
const cacheHits = new Counter('cache_hits');

// Test configuration
export const options = {
  scenarios: {
    // Ramp up to normal load
    normal_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },   // ramp up
        { duration: '5m', target: 20 },   // hold
        { duration: '2m', target: 0 },    // ramp down
      ],
    },
    // Spike test
    spike: {
      executor: 'ramping-vus',
      startTime: '10m',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },  // sudden spike
        { duration: '1m', target: 100 },   // hold spike
        { duration: '30s', target: 20 },   // back to normal
      ],
    },
  },
  thresholds: {
    // SLO thresholds
    http_req_duration: ['p(95)<500', 'p(99)<2000'],
    http_req_failed: ['rate<0.01'],       // < 1% error rate
    errors: ['rate<0.01'],
    weather_latency: ['p(95)<1000'],      // weather endpoint < 1s
    auth_latency: ['p(95)<500'],          // auth endpoint < 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const TEST_EMAIL = `loadtest-${Date.now()}@neptunefriend.test`;
const TEST_PASSWORD = 'loadtest-password-123';

let authToken = '';
let zoneIds: string[] = [];

export function setup() {
  // Register a test user
  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ name: 'Load Test User', email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (registerRes.status === 201) {
    const body = registerRes.json() as { data: { token: string } };
    authToken = body.data.token;
  }

  // Get zone IDs
  const zonesRes = http.get(`${BASE_URL}/weather/zones`);
  if (zonesRes.status === 200) {
    const body = zonesRes.json() as { data: { id: string }[] };
    zoneIds = body.data.slice(0, 10).map((z) => z.id);
  }

  return { authToken, zoneIds };
}

export default function (data: { authToken: string; zoneIds: string[] }) {
  const token = data.authToken;
  const zones = data.zoneIds;

  // Pick a random zone
  const zoneId = zones[Math.floor(Math.random() * zones.length)];

  const headers = {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };

  // Test 1 — Health check (lightest)
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check 200': (r) => r.status === 200,
    'health check fast': (r) => r.timings.duration < 100,
  });

  sleep(0.5);

  // Test 2 — Get weather conditions
  const start = Date.now();
  const weatherRes = http.get(`${BASE_URL}/weather/conditions/${zoneId}`, { headers });
  weatherLatency.add(Date.now() - start);

  const weatherOk = check(weatherRes, {
    'weather conditions 200': (r) => r.status === 200,
    'weather has wind data': (r) => {
      try {
        const body = r.json() as { data: { wind: unknown } };
        return !!body.data?.wind;
      } catch {
        return false;
      }
    },
  });

  if (!weatherOk) errorRate.add(1);
  else errorRate.add(0);

  // Track cache hits
  const cacheHeader = weatherRes.headers['X-Cache'];
  if (cacheHeader === 'HIT') cacheHits.add(1);

  sleep(1);

  // Test 3 — Get forecast (heavier)
  const forecastRes = http.get(`${BASE_URL}/weather/forecast/${zoneId}?hours=24`, { headers });
  check(forecastRes, {
    'forecast 200': (r) => r.status === 200,
  });

  sleep(1);

  // Test 4 — Auth me (protected endpoint)
  if (token) {
    const authStart = Date.now();
    const meRes = http.get(`${BASE_URL}/auth/me`, { headers });
    authLatency.add(Date.now() - authStart);

    check(meRes, {
      'auth me 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}

export function teardown(data: { authToken: string }) {
  // Nothing to clean up — in-memory auth
  console.log(`Load test complete. Auth token was: ${data.authToken ? 'set' : 'not set'}`);
}
