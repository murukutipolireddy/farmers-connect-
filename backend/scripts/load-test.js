import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.05'],     // http errors should be less than 5%
    http_req_duration: ['p(95)<1500'],  // 95% of requests should be below 1500ms
  },
};

export default function () {
  const baseUrl = __ENV.BACKEND_URL || 'http://localhost:4029';

  // 1. Health check
  const healthRes = http.get(`${baseUrl}/api/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // 2. Listings query (reads database index)
  const listingsRes = http.get(`${baseUrl}/api/listings`);
  check(listingsRes, {
    'listings status is 200': (r) => r.status === 200,
  });

  sleep(0.1);
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data, null, 2),
  };
}
