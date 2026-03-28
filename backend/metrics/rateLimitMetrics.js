const client = require('prom-client');

const rateLimitHits = new client.Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits (requests processed)',
  labelNames: ['tenant_id', 'endpoint', 'tier']
});

const rateLimitExceeded = new client.Counter({
  name: 'rate_limit_exceeded_total',
  help: 'Total number of requests that exceeded rate limits',
  labelNames: ['tenant_id', 'endpoint', 'tier']
});

const rateLimitUsage = new client.Gauge({
  name: 'rate_limit_current_usage',
  help: 'Current percentage of rate limit used',
  labelNames: ['tenant_id', 'endpoint', 'tier']
});

module.exports = {
  rateLimitHits,
  rateLimitExceeded,
  rateLimitUsage
};
