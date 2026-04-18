import { Request, Response, NextFunction } from 'express';

// Simple in-memory metrics store
// In production this integrates with prom-client
const metrics = {
  requestsTotal: new Map<string, number>(),
  requestDuration: new Map<string, number[]>(),
  weatherRequests: 0,
  weatherCacheHits: 0,
  weatherCacheMisses: 0,
  confusedSeaDetections: 0,
  weatherProviderRequests: new Map<string, number>(),
  weatherProviderSuccess: new Map<string, number>(),
};

export function recordWeatherRequest(cached: boolean) {
  metrics.weatherRequests++;
  if (cached) {
    metrics.weatherCacheHits++;
  } else {
    metrics.weatherCacheMisses++;
  }
}

export function recordConfusedSea() {
  metrics.confusedSeaDetections++;
}

export function recordProviderRequest(provider: string, success: boolean) {
  metrics.weatherProviderRequests.set(
    provider,
    (metrics.weatherProviderRequests.get(provider) ?? 0) + 1
  );
  if (success) {
    metrics.weatherProviderSuccess.set(
      provider,
      (metrics.weatherProviderSuccess.get(provider) ?? 0) + 1
    );
  }
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const key = `${req.method}:${res.statusCode}`;

    metrics.requestsTotal.set(key, (metrics.requestsTotal.get(key) ?? 0) + 1);

    const durations = metrics.requestDuration.get(req.path) ?? [];
    durations.push(duration);
    if (durations.length > 100) durations.shift(); // keep last 100
    metrics.requestDuration.set(req.path, durations);
  });

  next();
}

export function getMetrics(): string {
  const lines: string[] = [];

  // Request totals
  lines.push('# HELP neptunefriend_http_requests_total Total HTTP requests');
  lines.push('# TYPE neptunefriend_http_requests_total counter');
  for (const [key, count] of metrics.requestsTotal) {
    const [method, status] = key.split(':');
    lines.push(`neptunefriend_http_requests_total{method="${method}",status="${status}"} ${count}`);
  }

  // Weather metrics
  lines.push('# HELP neptunefriend_weather_requests_total Total weather API requests');
  lines.push('# TYPE neptunefriend_weather_requests_total counter');
  lines.push(`neptunefriend_weather_requests_total ${metrics.weatherRequests}`);

  lines.push('# HELP neptunefriend_weather_cache_hit_total Weather cache hits');
  lines.push('# TYPE neptunefriend_weather_cache_hit_total counter');
  lines.push(`neptunefriend_weather_cache_hit_total ${metrics.weatherCacheHits}`);

  lines.push('# HELP neptunefriend_weather_cache_miss_total Weather cache misses');
  lines.push('# TYPE neptunefriend_weather_cache_miss_total counter');
  lines.push(`neptunefriend_weather_cache_miss_total ${metrics.weatherCacheMisses}`);

  lines.push('# HELP neptunefriend_confused_sea_detected_total Confused sea detections');
  lines.push('# TYPE neptunefriend_confused_sea_detected_total counter');
  lines.push(`neptunefriend_confused_sea_detected_total ${metrics.confusedSeaDetections}`);

  // Provider metrics
  lines.push('# HELP neptunefriend_weather_provider_requests_total Requests per provider');
  lines.push('# TYPE neptunefriend_weather_provider_requests_total counter');
  for (const [provider, count] of metrics.weatherProviderRequests) {
    lines.push(`neptunefriend_weather_provider_requests_total{provider="${provider}"} ${count}`);
  }

  lines.push(
    '# HELP neptunefriend_weather_provider_success_total Successful responses per provider'
  );
  lines.push('# TYPE neptunefriend_weather_provider_success_total counter');
  for (const [provider, count] of metrics.weatherProviderSuccess) {
    lines.push(`neptunefriend_weather_provider_success_total{provider="${provider}"} ${count}`);
  }

  // Request duration averages
  lines.push('# HELP neptunefriend_request_duration_ms Average request duration per path');
  lines.push('# TYPE neptunefriend_request_duration_ms gauge');
  for (const [path, durations] of metrics.requestDuration) {
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    lines.push(`neptunefriend_request_duration_ms{path="${path}"} ${avg.toFixed(2)}`);
  }

  return lines.join('\n');
}
