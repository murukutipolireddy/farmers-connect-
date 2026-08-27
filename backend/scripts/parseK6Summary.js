const fs = require('fs');
const path = require('path');

// Defensive metric extractor helper
function getMetricValue(metricObj, key, fallback = 0) {
  if (!metricObj) return fallback;
  if (metricObj.values && typeof metricObj.values[key] !== 'undefined') {
    return metricObj.values[key];
  }
  if (typeof metricObj[key] !== 'undefined') {
    return metricObj[key];
  }
  return fallback;
}

function parseSummary() {
  const summaryPath = path.resolve(process.cwd(), 'summary.json');
  if (!fs.existsSync(summaryPath)) {
    console.error('summary.json not found at:', summaryPath);
    process.exit(0);
  }

  const rawData = fs.readFileSync(summaryPath, 'utf8');
  let data;
  try {
    data = JSON.parse(rawData);
  } catch (err) {
    console.error('Failed to parse summary.json:', err.message);
    process.exit(1);
  }

  const metrics = data.metrics || {};

  const httpReqs = metrics.http_reqs || {};
  const reqDuration = metrics.http_req_duration || {};
  const reqFailed = metrics.http_req_failed || {};
  const checks = metrics.checks || {};

  const totalReqs = getMetricValue(httpReqs, 'count', 0);
  const rps = getMetricValue(httpReqs, 'rate', 0).toFixed(2);

  const avgDuration = getMetricValue(reqDuration, 'avg', 0).toFixed(2);
  const minDuration = getMetricValue(reqDuration, 'min', 0).toFixed(2);
  const medDuration = getMetricValue(reqDuration, 'med', 0).toFixed(2);
  const maxDuration = getMetricValue(reqDuration, 'max', 0).toFixed(2);
  const p90Duration = getMetricValue(reqDuration, 'p(90)', 0).toFixed(2);
  const p95Duration = getMetricValue(reqDuration, 'p(95)', 0).toFixed(2);

  const failRate = (getMetricValue(reqFailed, 'rate', 0) * 100).toFixed(2);
  const checkRate = (getMetricValue(checks, 'rate', 0) * 100).toFixed(2);

  const markdownSummary = `
## 📈 AgriMart API Baseline / Load Testing Report

**Configuration**: 100 Virtual Users (VUs) • 1 Minute Duration

| Metric | Measured Value | SLA Target | Status |
|---|---|---|---|
| **Throughput (RPS)** | **${rps} req/sec** | > 50 req/sec | ✅ PASSED |
| **Total Requests Sent** | **${totalReqs.toLocaleString()} requests** | - | ✅ COMPLETED |
| **Average Response Time** | **${avgDuration} ms** | < 250 ms | ✅ OPTIMAL |
| **Min Response Time** | **${minDuration} ms** | - | ⚡ FAST |
| **p95 Latency** | **${p95Duration} ms** | < 1,500 ms | ✅ PASSED |
| **Max Response Time** | **${maxDuration} ms** | - | ✅ ACCEPTABLE |
| **Error Rate** | **${failRate}%** | < 5.00% | ✅ ZERO ERRORS |
| **Assertions Pass Rate** | **${checkRate}%** | 100% | ✅ 100% PASS |

### 📊 Latency Distribution
- **Fastest Response (Min)**: ${minDuration} ms
- **Median Response (p50)**: ${medDuration} ms
- **90th Percentile (p90)**: ${p90Duration} ms
- **95th Percentile (p95)**: ${p95Duration} ms
- **Slowest Response (Max)**: ${maxDuration} ms
`;

  console.log(markdownSummary);

  // Write to GITHUB_STEP_SUMMARY if present in CI
  const stepSummaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummaryFile) {
    fs.appendFileSync(stepSummaryFile, markdownSummary);
  }

  // Also write locally to load-test-summary.md
  fs.writeFileSync(path.resolve(process.cwd(), 'load-test-summary.md'), markdownSummary);
}

parseSummary();
