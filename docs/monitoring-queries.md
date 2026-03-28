# 🔍 VaultSphere CloudWatch Insights Queries

### 1. Errors for Specific Tenant (Last 24h)
```sql
fields @timestamp, @message, method, path, status_code
| filter tenant_id = "TENANT_001" and status_code >= 400
| sort @timestamp desc
| limit 50
```

### 2. Slow API Requests (> 1s)
```sql
fields @timestamp, path, tenant_id, response_time_ms
| filter response_time_ms > 1000
| sort response_time_ms desc
| stats avg(response_time_ms), max(response_time_ms) by path
```

### 3. Authentication Failures by User
```sql
fields @timestamp, user_id, ip, message
| filter message = "Login Failed" or status_code = 401
| stats count(*) as failure_count by user_id
| sort failure_count desc
```

### 4. Correlation of Resource Spikes with API Load
```sql
fields @timestamp, tenant_id, method, path, response_time_ms
| filter status_code >= 200
| stats count(*) as requests, avg(response_time_ms) as latency by bin(10m)
```

### 5. Top 10 Exception Types with Stack Traces
```sql
fields @timestamp, error, stack, tenant_id
| filter @message like /Unhandled/
| stats count(*) as exception_count by error
| sort exception_count desc
| limit 10
```
