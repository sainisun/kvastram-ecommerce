import { performance } from 'node:perf_hooks';

const baseUrl = process.env.API_URL || 'http://127.0.0.1:4000';
const requestCount = Number.parseInt(process.env.BENCHMARK_REQUESTS || '200', 10);
const concurrency = Number.parseInt(process.env.BENCHMARK_CONCURRENCY || '10', 10);
const maxP95Ms = Number.parseInt(process.env.BENCHMARK_MAX_P95_MS || '1000', 10);

if (!Number.isInteger(requestCount) || requestCount < 1) {
  throw new Error('BENCHMARK_REQUESTS must be a positive integer.');
}
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > requestCount) {
  throw new Error('BENCHMARK_CONCURRENCY must be between 1 and BENCHMARK_REQUESTS.');
}

const scenarios = [
  { name: 'health', path: '/health', expectedStatus: 200 },
  { name: 'tags', path: '/tags', expectedStatus: 200 },
];

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

async function runScenario(scenario) {
  const latencies = [];
  const failures = [];
  let nextIndex = 0;
  const startedAt = performance.now();

  async function worker() {
    while (nextIndex < requestCount) {
      const requestIndex = nextIndex++;
      const started = performance.now();
      try {
        const response = await fetch(`${baseUrl}${scenario.path}`, {
          headers: { accept: 'application/json' },
        });
        const latency = performance.now() - started;
        latencies.push(latency);
        if (response.status !== scenario.expectedStatus) {
          failures.push({ requestIndex, status: response.status, latencyMs: latency });
        }
        await response.arrayBuffer();
      } catch (error) {
        failures.push({ requestIndex, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  const elapsedMs = performance.now() - startedAt;
  const successCount = requestCount - failures.length;
  const result = {
    scenario: scenario.name,
    path: scenario.path,
    requestCount,
    concurrency,
    successCount,
    failureCount: failures.length,
    successRate: Number(((successCount / requestCount) * 100).toFixed(2)),
    throughputRequestsPerSecond: Number(((requestCount / elapsedMs) * 1000).toFixed(2)),
    latencyMs: {
      min: Number(Math.min(...latencies).toFixed(2)),
      p50: Number(percentile(latencies, 0.5).toFixed(2)),
      p95: Number(percentile(latencies, 0.95).toFixed(2)),
      max: Number(Math.max(...latencies).toFixed(2)),
    },
    failures,
  };

  if (result.failureCount > 0 || result.latencyMs.p95 > maxP95Ms) {
    throw new Error(`Performance budget failed for ${scenario.name}: ${JSON.stringify(result)}`);
  }
  return result;
}

async function main() {
  const health = await fetch(`${baseUrl}/health`);
  if (!health.ok) {
    throw new Error(`Benchmark target is unavailable: /health returned ${health.status}.`);
  }

  const results = [];
  for (const scenario of scenarios) results.push(await runScenario(scenario));
  console.log(JSON.stringify({
    benchmark: 'backend-read-paths',
    baseUrl,
    maxP95Ms,
    results,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
