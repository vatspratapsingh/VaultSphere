const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Assumes DB config exists

router.put('/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const { tier, requests_per_hour, requests_per_minute, custom_overrides } = req.body;

  try {
    const query = `
      INSERT INTO tenant_rate_limits (tenant_id, tier, requests_per_hour, requests_per_minute, custom_overrides)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (tenant_id) 
      DO UPDATE SET tier = $2, requests_per_hour = $3, requests_per_minute = $4, custom_overrides = $5, updated_at = NOW()
      RETURNING *;
    `;
    
    // In mock mode, we just return success
    if (process.env.NODE_ENV === 'development') {
      return res.json({ success: true, message: 'Mock limit updated', data: req.body });
    }

    const result = await db.query(query, [tenantId, tier, requests_per_hour, requests_per_minute, custom_overrides]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update rate limits', message: error.message });
  }
});

module.exports = router;
