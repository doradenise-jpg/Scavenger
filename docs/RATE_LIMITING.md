# API Rate Limiting

## Overview

Rate limiting is implemented as middleware to protect API endpoints from abuse and ensure fair resource usage.

## Configuration

Default limits:
- **Per Minute**: 60 requests
- **Per Hour**: 1000 requests

Configure via environment variables:
```bash
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
```

## Response Headers

All responses include rate limit information:
```
X-RateLimit-Limit-Minute: 60
X-RateLimit-Limit-Hour: 1000
```

## Error Handling

When rate limit is exceeded, the API returns:
```
HTTP 429 Too Many Requests
Content-Type: application/json

{
  "error": "Rate limit exceeded: 60 requests per minute"
}
```

## Implementation

The rate limiting middleware:
1. Tracks requests per IP address
2. Maintains separate buckets for minute and hour windows
3. Automatically cleans up expired entries
4. Returns 429 status when limits are exceeded

## Usage

The middleware is automatically applied to all routes in the application.

```rust
HttpServer::new(move || {
    App::new()
        .wrap(RateLimitMiddleware::new(rate_limit_config))
        // ... other middleware and routes
})
```

## Monitoring

Monitor rate limit violations in logs:
```
WARN: Rate limit exceeded for IP: 192.168.1.1
```
