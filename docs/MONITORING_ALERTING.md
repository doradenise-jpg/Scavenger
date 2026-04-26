# Monitoring and Alerting

## Overview
Comprehensive monitoring using Prometheus for metrics collection and Grafana for visualization.

## Components

### Prometheus
- Scrapes metrics from all services
- Stores time-series data with 30-day retention
- Evaluates alert rules
- Metrics endpoints: 8080 (contract), 8081 (indexer)

### Grafana
- Visualizes metrics and creates dashboards
- Default credentials: admin/admin
- Access: http://localhost:3000
- Pre-configured data source: Prometheus

### AlertManager
- Routes and manages alerts
- Sends notifications to Slack/PagerDuty
- Groups related alerts
- Deduplicates notifications

## Key Metrics

### Application Metrics
- `contract_errors_total` - Total contract errors
- `contract_transaction_duration_seconds` - Transaction latency
- `participants_registered_total` - Participant registrations
- `waste_submitted_total` - Waste submissions
- `incentives_distributed_total` - Incentive distributions

### Infrastructure Metrics
- `node_memory_MemAvailable_bytes` - Available memory
- `node_cpu_seconds_total` - CPU time
- `node_filesystem_avail_bytes` - Disk space

## Alert Rules

### Critical Alerts
- High error rate (>5% over 5 minutes)
- Disk space low (<10%)
- Service unavailable

### Warning Alerts
- Slow transactions (P95 > 5s)
- High memory usage (>85%)
- High CPU usage (>80%)
- Low participant activity

## Setup

### Local Development
```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### Configure Slack Notifications
```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

## Dashboards

Pre-built dashboards:
1. **System Overview** - CPU, memory, disk, network
2. **Contract Metrics** - Transaction volume, latency, errors
3. **Participant Activity** - Registrations, waste submissions
4. **Supply Chain** - Material flow, incentive distribution

## SLA Monitoring

- Transaction success rate: >99.5%
- P95 latency: <5 seconds
- Error rate: <0.1%
- Uptime: >99.9%
