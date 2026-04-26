# CDN Configuration

Scavenger uses AWS CloudFront for global content delivery with optimized caching policies.

## Architecture

- **Origin**: S3 bucket with static assets
- **Distribution**: CloudFront CDN with edge locations worldwide
- **Cache Layers**: Optimized for different content types
- **SSL/TLS**: Custom domain with ACM certificate

## Cache Policies

### Static Assets (`/static/*`)
- **TTL**: 1 year (31536000 seconds)
- **Compression**: Enabled
- **Versioning**: Content-hash based filenames

### API Endpoints (`/api/*`)
- **TTL**: 0 seconds (no caching)
- **Query Strings**: Forwarded
- **Cookies**: Forwarded

### HTML/JS/CSS
- **TTL**: 1 day (86400 seconds)
- **Compression**: Enabled
- **Query Strings**: Not forwarded

## Setup

### Prerequisites

- AWS Account with CloudFront access
- S3 bucket for origin
- ACM certificate for custom domain

### Deployment

1. **Create S3 Origin**
```bash
aws s3 mb s3://scavenger-app-cdn
aws s3api put-bucket-versioning \
  --bucket scavenger-app-cdn \
  --versioning-configuration Status=Enabled
```

2. **Deploy CloudFront Distribution**
```bash
aws cloudfront create-distribution-with-tags \
  --distribution-config-with-tags file://config/cloudfront-distribution.yaml
```

3. **Update DNS**
```bash
# Point CNAME to CloudFront domain
# scavenger.example.com -> d111111abcdef8.cloudfront.net
```

## Cache Invalidation

Invalidate cache after deployments:

```bash
./scripts/cdn-invalidation.sh "/*"
```

Or specific paths:

```bash
./scripts/cdn-invalidation.sh "/index.html /app.js"
```

## Image Optimization

CloudFront automatically optimizes images:

- **WebP**: Served to supported browsers
- **Compression**: Automatic gzip/brotli
- **Responsive**: Automatic format selection

## Monitoring

Monitor CDN performance in CloudWatch:

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name BytesDownloaded \
  --dimensions Name=DistributionId,Value=E1234567890ABC \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

## Cost Optimization

- **Price Class**: PriceClass_100 (reduced edge locations)
- **Compression**: Reduces bandwidth by 60-80%
- **Cache Hit Ratio**: Target > 90%
