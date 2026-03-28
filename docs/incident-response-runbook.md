# 🚨 VaultSphere Incident Response Runbook

## Alert: High_CPU_Utilization (> 90%)
- **Impact**: Potential service degradation and request latency.
- **Steps**:
  1.  Check CloudWatch Metrics for ECS Cluster.
  2.  Run Insights query for slow API requests (`Slow API Requests (> 1s)`).
  3.  Scale service horizontally via ECS if load is legitimate.
  4.  Identify specific `tenant_id` causing the spike.

## Alert: DB_Connection_Exhaustion (> 90%)
- **Impact**: Database query failures and application crashes.
- **Steps**:
  1.  Inspect active connections in RDS performance insights.
  2.  Kill long-running or leaked connections.
  3.  Verify connection pooling configuration in backend.

## Alert: High_API_Error_Rate (> 5%)
- **Impact**: Broken user features and potential security risk.
- **Steps**:
  1.  Run `Top 10 Exception Types` Insight query.
  2.  Look for code regressions or external API failures.
  3.  Roll back to the previous stable build if necessary.
