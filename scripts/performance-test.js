#!/usr/bin/env node

/**
 * VaultSphere Performance Testing Script
 * Tests API performance, load handling, and system metrics
 */

// Import axios
const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const config = {
  baseURL: process.env.API_BASE_URL || 'http://localhost:5001',
  concurrency: parseInt(process.env.CONCURRENCY) || 10,
  duration: parseInt(process.env.DURATION) || 60, // seconds
  rampUp: parseInt(process.env.RAMP_UP) || 10, // seconds
  testUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test User'
  }
};

// Test results storage
const results = {
  requests: [],
  errors: [],
  metrics: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    requestsPerSecond: 0,
    errorRate: 0
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  metric: (msg) => console.log(`${colors.cyan}[METRIC]${colors.reset} ${msg}`)
};

// HTTP client with timeout
const client = axios.create({
  baseURL: config.baseURL,
  timeout: 30000,
  validateStatus: () => true // Don't throw on HTTP errors
});

// Test scenarios
const scenarios = {
  // Health check test
  healthCheck: async () => {
    const start = performance.now();
    const response = await client.get('/api/health');
    const duration = performance.now() - start;
    
    return {
      scenario: 'health-check',
      status: response.status,
      duration,
      success: response.status === 200,
      size: JSON.stringify(response.data).length
    };
  },

  // User registration test
  userRegistration: async () => {
    const start = performance.now();
    const userData = {
      ...config.testUser,
      email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
    };
    
    const response = await client.post('/api/auth/register', userData);
    const duration = performance.now() - start;
    
    return {
      scenario: 'user-registration',
      status: response.status,
      duration,
      success: response.status === 201,
      size: JSON.stringify(response.data).length
    };
  },

  // User login test
  userLogin: async () => {
    const start = performance.now();
    const response = await client.post('/api/auth/login', {
      email: config.testUser.email,
      password: config.testUser.password
    });
    const duration = performance.now() - start;
    
    return {
      scenario: 'user-login',
      status: response.status,
      duration,
      success: response.status === 200,
      size: JSON.stringify(response.data).length,
      token: response.data?.token
    };
  },

  // Authenticated API test
  authenticatedRequest: async (token) => {
    const start = performance.now();
    const response = await client.get('/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const duration = performance.now() - start;
    
    return {
      scenario: 'authenticated-request',
      status: response.status,
      duration,
      success: response.status === 200,
      size: JSON.stringify(response.data).length
    };
  },

  // Metrics endpoint test
  metricsCheck: async () => {
    const start = performance.now();
    const response = await client.get('/api/metrics');
    const duration = performance.now() - start;
    
    return {
      scenario: 'metrics-check',
      status: response.status,
      duration,
      success: response.status === 200,
      size: response.data ? response.data.length : 0
    };
  }
};

// Execute a single test request
async function executeTest(scenario, ...args) {
  try {
    const result = await scenarios[scenario](...args);
    results.requests.push(result);
    results.metrics.totalRequests++;
    
    if (result.success) {
      results.metrics.successfulRequests++;
    } else {
      results.metrics.failedRequests++;
      results.errors.push({
        scenario: result.scenario,
        status: result.status,
        timestamp: new Date().toISOString()
      });
    }
    
    // Update response time metrics
    results.metrics.minResponseTime = Math.min(results.metrics.minResponseTime, result.duration);
    results.metrics.maxResponseTime = Math.max(results.metrics.maxResponseTime, result.duration);
    
    return result;
  } catch (error) {
    results.errors.push({
      scenario,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    results.metrics.totalRequests++;
    results.metrics.failedRequests++;
    
    return {
      scenario,
      success: false,
      duration: 0,
      error: error.message
    };
  }
}

// Run load test with multiple concurrent users
async function runLoadTest() {
  log.info(`Starting load test with ${config.concurrency} concurrent users for ${config.duration} seconds`);
  
  const startTime = Date.now();
  const endTime = startTime + (config.duration * 1000);
  const workers = [];
  
  // Create worker functions
  for (let i = 0; i < config.concurrency; i++) {
    const worker = async () => {
      let token = null;
      
      // Try to get authentication token
      try {
        const loginResult = await executeTest('userLogin');
        if (loginResult.success && loginResult.token) {
          token = loginResult.token;
        }
      } catch (error) {
        log.warning(`Worker ${i} failed to authenticate: ${error.message}`);
      }
      
      // Run tests until duration expires
      while (Date.now() < endTime) {
        const testType = Math.random();
        
        if (testType < 0.4) {
          // 40% health checks
          await executeTest('healthCheck');
        } else if (testType < 0.6) {
          // 20% metrics checks
          await executeTest('metricsCheck');
        } else if (testType < 0.8 && token) {
          // 20% authenticated requests (if token available)
          await executeTest('authenticatedRequest', token);
        } else {
          // 20% user registrations
          await executeTest('userRegistration');
        }
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      }
    };
    
    workers.push(worker());
    
    // Ramp up gradually
    if (config.rampUp > 0) {
      await new Promise(resolve => setTimeout(resolve, (config.rampUp * 1000) / config.concurrency));
    }
  }
  
  // Wait for all workers to complete
  await Promise.all(workers);
  
  const totalDuration = (Date.now() - startTime) / 1000;
  
  // Calculate final metrics
  const totalResponseTime = results.requests.reduce((sum, req) => sum + req.duration, 0);
  results.metrics.averageResponseTime = totalResponseTime / results.requests.length || 0;
  results.metrics.requestsPerSecond = results.metrics.totalRequests / totalDuration;
  results.metrics.errorRate = (results.metrics.failedRequests / results.metrics.totalRequests) * 100;
  
  log.success(`Load test completed in ${totalDuration.toFixed(2)} seconds`);
}

// System health check
async function checkSystemHealth() {
  log.info('Checking system health...');
  
  try {
    const healthResponse = await client.get('/api/health');
    if (healthResponse.status === 200) {
      log.success('System health check passed');
      
      const healthData = healthResponse.data;
      if (healthData.memory) {
        log.metric(`Memory usage: ${healthData.memory.heapUsed} / ${healthData.memory.heapTotal}`);
      }
      if (healthData.uptime) {
        log.metric(`System uptime: ${Math.floor(healthData.uptime / 60)} minutes`);
      }
      if (healthData.database) {
        log.metric(`Database status: ${healthData.database.status}`);
        if (healthData.database.responseTime) {
          log.metric(`Database response time: ${healthData.database.responseTime}`);
        }
      }
      
      return true;
    } else {
      log.error(`Health check failed with status: ${healthResponse.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
    return false;
  }
}

// Performance baseline test
async function runBaselineTest() {
  log.info('Running performance baseline test...');
  
  const tests = [
    { name: 'Health Check', scenario: 'healthCheck', iterations: 10 },
    { name: 'User Registration', scenario: 'userRegistration', iterations: 5 },
    { name: 'User Login', scenario: 'userLogin', iterations: 5 },
    { name: 'Metrics Check', scenario: 'metricsCheck', iterations: 10 }
  ];
  
  for (const test of tests) {
    log.info(`Running ${test.name} baseline (${test.iterations} iterations)...`);
    
    const testResults = [];
    for (let i = 0; i < test.iterations; i++) {
      const result = await executeTest(test.scenario);
      testResults.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const avgResponseTime = testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length;
    const successRate = (testResults.filter(r => r.success).length / testResults.length) * 100;
    
    log.metric(`${test.name}: Avg response time: ${avgResponseTime.toFixed(2)}ms, Success rate: ${successRate.toFixed(1)}%`);
  }
}

// Generate performance report
function generateReport() {
  log.info('Generating performance report...');
  
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}VAULTSPHERE PERFORMANCE TEST REPORT${colors.reset}`);
  console.log('='.repeat(60));
  
  console.log(`\n${colors.bright}Test Configuration:${colors.reset}`);
  console.log(`  Base URL: ${config.baseURL}`);
  console.log(`  Concurrency: ${config.concurrency} users`);
  console.log(`  Duration: ${config.duration} seconds`);
  console.log(`  Ramp-up: ${config.rampUp} seconds`);
  
  console.log(`\n${colors.bright}Overall Metrics:${colors.reset}`);
  console.log(`  Total Requests: ${results.metrics.totalRequests}`);
  console.log(`  Successful Requests: ${results.metrics.successfulRequests}`);
  console.log(`  Failed Requests: ${results.metrics.failedRequests}`);
  console.log(`  Success Rate: ${((results.metrics.successfulRequests / results.metrics.totalRequests) * 100).toFixed(2)}%`);
  console.log(`  Error Rate: ${results.metrics.errorRate.toFixed(2)}%`);
  
  console.log(`\n${colors.bright}Response Time Metrics:${colors.reset}`);
  console.log(`  Average Response Time: ${results.metrics.averageResponseTime.toFixed(2)}ms`);
  console.log(`  Min Response Time: ${results.metrics.minResponseTime.toFixed(2)}ms`);
  console.log(`  Max Response Time: ${results.metrics.maxResponseTime.toFixed(2)}ms`);
  
  console.log(`\n${colors.bright}Throughput Metrics:${colors.reset}`);
  console.log(`  Requests per Second: ${results.metrics.requestsPerSecond.toFixed(2)}`);
  
  // Scenario breakdown
  const scenarioStats = {};
  results.requests.forEach(req => {
    if (!scenarioStats[req.scenario]) {
      scenarioStats[req.scenario] = {
        count: 0,
        totalTime: 0,
        successes: 0,
        failures: 0
      };
    }
    
    scenarioStats[req.scenario].count++;
    scenarioStats[req.scenario].totalTime += req.duration;
    if (req.success) {
      scenarioStats[req.scenario].successes++;
    } else {
      scenarioStats[req.scenario].failures++;
    }
  });
  
  console.log(`\n${colors.bright}Scenario Breakdown:${colors.reset}`);
  Object.entries(scenarioStats).forEach(([scenario, stats]) => {
    const avgTime = stats.totalTime / stats.count;
    const successRate = (stats.successes / stats.count) * 100;
    console.log(`  ${scenario}:`);
    console.log(`    Requests: ${stats.count}`);
    console.log(`    Avg Response Time: ${avgTime.toFixed(2)}ms`);
    console.log(`    Success Rate: ${successRate.toFixed(1)}%`);
  });
  
  // Error summary
  if (results.errors.length > 0) {
    console.log(`\n${colors.bright}Error Summary:${colors.reset}`);
    const errorTypes = {};
    results.errors.forEach(error => {
      const key = error.status || error.error || 'Unknown';
      errorTypes[key] = (errorTypes[key] || 0) + 1;
    });
    
    Object.entries(errorTypes).forEach(([error, count]) => {
      console.log(`  ${error}: ${count} occurrences`);
    });
  }
  
  // Performance assessment
  console.log(`\n${colors.bright}Performance Assessment:${colors.reset}`);
  
  if (results.metrics.averageResponseTime < 100) {
    console.log(`  ${colors.green}✓ Excellent response times (< 100ms)${colors.reset}`);
  } else if (results.metrics.averageResponseTime < 500) {
    console.log(`  ${colors.yellow}⚠ Good response times (< 500ms)${colors.reset}`);
  } else {
    console.log(`  ${colors.red}✗ Poor response times (> 500ms)${colors.reset}`);
  }
  
  if (results.metrics.errorRate < 1) {
    console.log(`  ${colors.green}✓ Excellent error rate (< 1%)${colors.reset}`);
  } else if (results.metrics.errorRate < 5) {
    console.log(`  ${colors.yellow}⚠ Acceptable error rate (< 5%)${colors.reset}`);
  } else {
    console.log(`  ${colors.red}✗ High error rate (> 5%)${colors.reset}`);
  }
  
  if (results.metrics.requestsPerSecond > 100) {
    console.log(`  ${colors.green}✓ High throughput (> 100 req/s)${colors.reset}`);
  } else if (results.metrics.requestsPerSecond > 50) {
    console.log(`  ${colors.yellow}⚠ Moderate throughput (> 50 req/s)${colors.reset}`);
  } else {
    console.log(`  ${colors.red}✗ Low throughput (< 50 req/s)${colors.reset}`);
  }
  
  console.log('\n' + '='.repeat(60));
}

// Main execution
async function main() {
  const testType = process.argv[2] || 'load';
  
  console.log(`${colors.bright}VaultSphere Performance Testing Tool${colors.reset}\n`);
  
  // Check system health first
  const healthOk = await checkSystemHealth();
  if (!healthOk) {
    log.error('System health check failed. Aborting tests.');
    process.exit(1);
  }
  
  switch (testType) {
    case 'baseline':
      await runBaselineTest();
      break;
    case 'load':
      await runLoadTest();
      break;
    case 'health':
      // Health check already done above
      break;
    default:
      log.error(`Unknown test type: ${testType}`);
      console.log('Usage: node performance-test.js [baseline|load|health]');
      process.exit(1);
  }
  
  if (testType !== 'health') {
    generateReport();
  }
  
  log.success('Performance testing completed!');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  log.warning('Test interrupted by user');
  if (results.requests.length > 0) {
    generateReport();
  }
  process.exit(0);
});

// Run the tests
main().catch(error => {
  log.error(`Test execution failed: ${error.message}`);
  process.exit(1);
});