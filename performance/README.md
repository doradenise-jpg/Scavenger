# Performance Testing Configuration

## k6 Load Testing

### Setup
```bash
# Install k6
brew install k6  # macOS
# or
sudo apt-get install k6  # Linux
```

### Running Tests

**Local Development:**
```bash
k6 run performance/k6-load-test.js
```

**Against Testnet:**
```bash
BASE_URL=https://testnet-rpc.example.com k6 run performance/k6-load-test.js
```

**With Custom Configuration:**
```bash
k6 run \
  --vus 100 \
  --duration 5m \
  --rps 1000 \
  performance/k6-load-test.js
```

### Performance Budgets

- API Response Time (p95): < 500ms
- Contract Call Duration (p95): < 1000ms
- Error Rate: < 10%
- Throughput: > 100 requests/second

### Metrics Tracked

- `api_duration` - HTTP request duration
- `contract_call_duration` - Smart contract execution time
- `errors` - Error rate
- `success_count` - Successful operations
- `failure_count` - Failed operations

### CI/CD Integration

Performance tests run on every push to `develop` and `main` branches. Results are compared against baseline thresholds.
