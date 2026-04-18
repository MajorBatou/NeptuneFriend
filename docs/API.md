# NeptuneFriend API Documentation

Base URL: `https://api.neptunefriend.app`
Staging: `https://api.staging.neptunefriend.app`
Local: `http://localhost:4000`

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are returned on register/login and expire after 7 days.

---

## Endpoints

### Health

#### GET /health
Returns API and database status.

**Response:**
```json
{
  "status": "ok",
  "service": "neptunefriend-api",
  "database": "connected",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

---

### Authentication

#### POST /auth/register
Register a new user account.

**Body:**
```json
{
  "name": "Your Name",
  "email": "you@example.com",
  "password": "minimum8chars"
}
```

**Response (201):**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "Your Name",
      "email": "you@example.com",
      "favoriteZones": [],
      "preferences": { "units": "nautical", "windSpeedUnit": "knots" }
    },
    "token": "jwt-token",
    "expiresAt": "2026-01-08T00:00:00.000Z"
  },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

**Errors:** 409 (email exists), 400 (validation), 429 (rate limited)

---

#### POST /auth/login
Login with existing credentials.

**Body:**
```json
{
  "email": "you@example.com",
  "password": "yourpassword"
}
```

**Response (200):** Same shape as register.

**Errors:** 401 (invalid credentials), 429 (rate limited)

---

#### GET /auth/me 🔒
Get the current authenticated user.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Your Name",
    "email": "you@example.com",
    "favoriteZones": ["zone-id-1"],
    "preferences": { "units": "nautical" }
  }
}
```

---

### Weather

#### GET /weather/zones
Get all 37 sailing zones with current conditions.

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Solent",
      "description": "...",
      "lat": 50.77,
      "lng": -1.3,
      "conditions": {
        "wind": { "speed": 15, "direction": 220, "gust": 20, "beaufort": 4 },
        "waves": {
          "height": 1.2,
          "primarySwell": { "height": 0.8, "period": 8, "direction": 210, "steepness": 0.1 },
          "secondarySwell": { "height": 0.5, "period": 5, "direction": 180, "steepness": 0.1 },
          "seaState": "slight",
          "confusedSea": false
        },
        "tides": { "height": 2.1, "flow": "flood", "nextHigh": "...", "nextLow": "..." },
        "safetyRating": "safe",
        "models": [
          { "model": "ecmwf", "weight": 45 },
          { "model": "icon", "weight": 30 },
          { "model": "open-meteo", "weight": 25 }
        ]
      }
    }
  ],
  "timestamp": "..."
}
```

---

#### GET /weather/conditions/:zoneId
Get live conditions for a specific zone.

**Params:** `zoneId` — UUID of the sailing zone

**Response (200):** Same `conditions` shape as above.

**Headers:** `X-Cache: HIT|MISS`

**Errors:** 404 (zone not found)

---

#### GET /weather/forecast/:zoneId
Get hourly forecast for a zone.

**Params:** `zoneId` — UUID
**Query:** `hours` — 24, 72, or 168 (default: 24)

**Response (200):**
```json
{
  "data": {
    "zoneId": "uuid",
    "points": [
      {
        "timestamp": "2026-01-01T00:00:00.000Z",
        "wind": { "speed": 12, "direction": 200, "gust": 16, "beaufort": 3 },
        "waves": { "height": 0.8, "primarySwell": {...}, "seaState": "slight" }
      }
    ],
    "generatedAt": "..."
  }
}
```

---

#### GET /weather/nearest
Find the nearest sailing zone to coordinates.

**Query:** `lat`, `lng`

**Example:** `GET /weather/nearest?lat=50.9&lng=-1.4`

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Solent",
    "lat": 50.77,
    "lng": -1.3
  }
}
```

---

#### POST /weather/conditions/bulk 🔒
Get conditions for multiple zones in one request.

**Body:**
```json
{
  "zoneIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Response (200):**
```json
{
  "data": [
    { "zoneId": "uuid-1", "conditions": {...} },
    { "zoneId": "uuid-2", "conditions": null }
  ]
}
```

---

## Error Responses

All errors follow this shape:

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "statusCode": 401,
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

| Code | Meaning |
|------|---------|
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Not authorized |
| 404 | Resource not found |
| 409 | Conflict (e.g. email exists) |
| 429 | Rate limited |
| 500 | Internal server error |

---

## Rate Limits

| Endpoint group | Limit |
|---------------|-------|
| `POST /auth/*` | 10 requests per 15 minutes |
| All other endpoints | 100 requests per minute |
