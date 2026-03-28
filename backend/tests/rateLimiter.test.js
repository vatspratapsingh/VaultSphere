const { redis } = require('../config/redis');
const rateLimiter = require('../middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  let mockReq, mockRes, next;

  beforeEach(() => {
    mockReq = {
      path: '/api/tasks',
      method: 'GET',
      user: { tenant_id: 'tenant_1', tier: 'basic' }
    };
    mockRes = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterAll(async () => {
    await redis.quit();
  });

  test('should allow requests within limit', async () => {
    await rateLimiter(mockReq, mockRes, next);
    expect(next).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test('should apply multipliers for POST requests', async () => {
    mockReq.method = 'POST';
    // Base basic min limit is 100. With 0.5 multiplier, it should be 50.
    await rateLimiter(mockReq, mockRes, next);
    expect(mockRes.set).toHaveBeenCalledWith('X-RateLimit-Limit', 50);
  });

  test('should fail open if Redis is down', async () => {
    // Mock getRedisStatus to return disconnected
    jest.mock('../config/redis', () => ({
      getRedisStatus: () => ({ isConnected: false }),
      redis: {}
    }));
    
    await rateLimiter(mockReq, mockRes, next);
    expect(next).toHaveBeenCalled();
  });
});
