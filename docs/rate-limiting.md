# 🚀 VaultSphere API Rate Limiting

To ensure platform stability and fair usage, VaultSphere enforces per-tenant rate limits based on your subscription tier.

## 📊 Subscription Tiers

| Tier | Requests per Minute | Requests per Hour |
| :--- | :--- | :--- |
| **Basic** | 100 | 1,000 |
| **Standard** | 500 | 5,000 |
| **Enterprise** | 2,000 | 20,000 |

## 🔍 Granular Rules
Different types of requests have different "weights":
- **Read (GET)**: 1.0 multiplier (standard)
- **Write (POST/PUT/DELETE)**: 0.5 multiplier (costs 2x standard)
- **ML Analysis**: 0.2 multiplier (costs 5x standard)

## 🛠️ Checking Your Usage
Every API response includes the following headers:
- `X-RateLimit-Limit`: Total requests allowed in the current window.
- `X-RateLimit-Remaining`: Requests remaining.
- `X-RateLimit-Reset`: Unix timestamp when the limit resets.

## 🚨 Handling 429 Errors
If you receive an HTTP 429 response, you have exceeded your limit. Check the `Retry-After` header for the number of seconds to wait before retrying.

## 📈 Requesting Limit Increases
Please contact `support@vaultsphere.cloud` to upgrade your tier or request custom overrides for high-volume endpoints.
