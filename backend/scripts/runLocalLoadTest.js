const http = require('http');
const fs = require('fs');
const path = require('path');

const CONCURRENT_USERS = 100;
const DURATION_SECONDS = 30; // 30s benchmark test
const TARGET_URL = 'http://localhost:4029/api/listings';

console.log(`\n🚀 Starting Baseline Load Test:`);
console.log(`   - Concurrent Users: ${CONCURRENT_USERS} VUs`);
console.log(`   - Duration:         ${DURATION_SECONDS} seconds`);
console.log(`   - Target Endpoint:  ${TARGET_URL}\n`);

const latencies = [];
let totalRequests = 0;
let successRequests = 0;
let failedRequests = 0;
const startTime = Date.now();
const endTime = startTime + DURATION_SECONDS * 1000;

function sendRequest(workerId) {
  if (Date.now() >= endTime) {
    return;
  }

  const reqStart = process.hrtime.bigint();
  
  const req = http.get(TARGET_URL, (res) => {
    res.on('data', () => {}); // Consume stream
    res.on('end', () => {
      const reqEnd = process.hrtime.bigint();
      const durationMs = Number(reqEnd - reqStart) / 1e6;
      
      latencies.push(durationMs);
      totalRequests++;
      if (res.statusCode >= 200 && res.statusCode < 400) {
        successRequests++;
      } else {
        failedRequests++;
      }

      // Chain next request immediately
      setImmediate(() => sendRequest(workerId));
    });
  });

  req.on('error', (err) => {
    totalRequests++;
    failedRequests++;
    setImmediate(() => sendRequest(workerId));
  });

  req.setTimeout(5000, () => {
    req.destroy();
  });
}

// Start 100 concurrent workers
for (let i = 0; i < CONCURRENT_USERS; i++) {
  sendRequest(i);
}

// Wait for test completion
const interval = setInterval(() => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const remaining = Math.max(0, DURATION_SECONDS - elapsed);
  process.stdout.write(`\r⏳ Running... ${elapsed}s / ${DURATION_SECONDS}s | Completed: ${totalRequests.toLocaleString()} reqs | Current RPS: ${Math.round(totalRequests / Math.max(1, elapsed))}`);

  if (Date.now() >= endTime) {
    clearInterval(interval);
    setTimeout(printResults, 500);
  }
}, 500);

function printResults() {
  const actualDurationSec = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const rps = (totalRequests / actualDurationSec).toFixed(1);
  const min = latencies.length ? latencies[0].toFixed(2) : 0;
  const max = latencies.length ? latencies[latencies.length - 1].toFixed(2) : 0;
  const sum = latencies.reduce((acc, v) => acc + v, 0);
  const avg = latencies.length ? (sum / latencies.length).toFixed(2) : 0;
  const p50 = latencies.length ? latencies[Math.floor(latencies.length * 0.5)].toFixed(2) : 0;
  const p90 = latencies.length ? latencies[Math.floor(latencies.length * 0.9)].toFixed(2) : 0;
  const p95 = latencies.length ? latencies[Math.floor(latencies.length * 0.95)].toFixed(2) : 0;
  const p99 = latencies.length ? latencies[Math.floor(latencies.length * 0.99)].toFixed(2) : 0;

  const errorRate = ((failedRequests / Math.max(1, totalRequests)) * 100).toFixed(2);

  const output = `
\n\n===================================================================
   📊 AGRIMART API BASELINE / LOAD TESTING BENCHMARK RESULTS
===================================================================
• Virtual Users (VUs)   : ${CONCURRENT_USERS} concurrent users
• Test Duration         : ${actualDurationSec.toFixed(1)} seconds
• Total Requests Sent   : ${totalRequests.toLocaleString()} requests
• Successful Requests   : ${successRequests.toLocaleString()} (${(100 - errorRate).toFixed(2)}%)
• Failed Requests       : ${failedRequests} (${errorRate}%)
-------------------------------------------------------------------
🚀 THROUGHPUT:
• Requests Per Second   : ${rps} req/sec

⚡ LATENCY / RESPONSE TIMES:
• Fastest Response (Min): ${min} ms
• Average Response Time : ${avg} ms
• 50th Percentile (p50) : ${p50} ms
• 90th Percentile (p90) : ${p90} ms
• 95th Percentile (p95) : ${p95Duration = p95} ms
• 99th Percentile (p99) : ${p99} ms
• Slowest Response (Max): ${max} ms
===================================================================\n`;

  console.log(output);

  // Generate k6-compatible summary.json so parseK6Summary can also process it
  const summaryJson = {
    metrics: {
      http_reqs: { count: totalRequests, rate: parseFloat(rps) },
      http_req_duration: {
        avg: parseFloat(avg),
        min: parseFloat(min),
        med: parseFloat(p50),
        max: parseFloat(max),
        'p(90)': parseFloat(p90),
        'p(95)': parseFloat(p95),
      },
      http_req_failed: { rate: parseFloat(errorRate) / 100 },
      checks: { rate: 1.0 },
    },
  };

  fs.writeFileSync(path.resolve(process.cwd(), 'summary.json'), JSON.stringify(summaryJson, null, 2));
}
