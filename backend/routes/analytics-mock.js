const express = require('express');
const router = express.Router();

// Mock metadata for analytics charts with ML-generated images
const analyticsMetadata = {
  '1': { // Food Tenant
    name: 'Healthy Foods Inc.',
    charts: [
      { 
        id: 'usage_forecast', 
        title: 'Usage Forecast', 
        type: 'line', 
        url: '/analytics/food_forecast.png', 
        description: 'CPU/RAM utilization forecast for the next 7 days using Linear Regression models.' 
      },
      { 
        id: 'anomaly_detection', 
        title: 'Anomaly Detection', 
        type: 'scatter', 
        url: '/analytics/lstm_anomaly_characteristics.png', 
        description: 'LSTM Autoencoder-based anomaly identification in resource logs with reconstruction error analysis.' 
      },
      { 
        id: 'cost_optimization', 
        title: 'Cost Optimization', 
        type: 'analysis', 
        url: '/analytics/isolation_forest_score_analysis.png', 
        description: 'Predicted vs actual cloud expenditure analysis using Random Forest regression models.' 
      },
      { 
        id: 'admin_summary', 
        title: 'Admin Summary', 
        type: 'dashboard', 
        url: '/analytics/vaultsphere_analytics_dashboard.png', 
        description: 'Overall system performance summary with multi-tenant resource efficiency metrics.' 
      }
    ]
  },
  '2': { // IT Tenant
    name: 'Tech Solutions Ltd.',
    charts: [
      { 
        id: 'compute_forecast', 
        title: 'Compute Forecast', 
        type: 'line', 
        url: '/analytics/it_forecast.png', 
        description: 'Workload prediction for developer environments using Linear Regression models.' 
      },
      { 
        id: 'security_anomaly', 
        title: 'Security Anomaly Detection', 
        type: 'scatter', 
        url: '/analytics/isolation_forest_analysis.png', 
        description: 'Isolation Forest based security threat detection with statistical outlier analysis.' 
      },
      { 
        id: 'tenant_segmentation', 
        title: 'Tenant Segmentation', 
        type: 'clusters', 
        url: '/analytics/it_clusters.png', 
        description: 'K-Means clustering of tenant behavior patterns for resource optimization.' 
      },
      { 
        id: 'global_insights', 
        title: 'Global Insights', 
        type: 'dashboard', 
        url: '/analytics/performance_dashboard.png', 
        description: 'Consolidated performance metrics across all nodes with ML-driven insights.' 
      }
    ]
  }
};

// Mock ML endpoint for testing rate limiter multipliers
router.post('/ml/analyze', (req, res) => {
  res.json({
    success: true,
    message: 'Mock ML Analysis complete',
    results: { anomalies: 2, confidence: 0.98 }
  });
});

router.get('/:tenantId', (req, res) => {
  const { tenantId } = req.params;
  const data = analyticsMetadata[tenantId];
  
  if (!data) {
    return res.status(404).json({ error: 'Tenant analytics not found' });
  }
  
  res.json(data);
});

module.exports = router;
