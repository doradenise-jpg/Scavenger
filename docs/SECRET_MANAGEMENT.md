# Secret Management

Scavenger uses HashiCorp Vault for secure secret management with automatic rotation and audit logging.

## Architecture

- **Vault Server**: Central secret store with encryption at rest
- **Vault Agent**: Sidecar for automatic secret injection
- **Kubernetes Auth**: Pod identity-based authentication
- **Audit Logging**: All secret access is logged

## Setup

### Prerequisites

- Vault 1.12+
- Kubernetes cluster
- kubectl access

### Installation

1. **Deploy Vault**
```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault \
  --namespace vault \
  --create-namespace \
  -f config/vault-values.yaml
```

2. **Initialize Vault**
```bash
./scripts/init-vault.sh
```

3. **Configure Kubernetes Auth**
```bash
vault auth enable kubernetes
vault write auth/kubernetes/config \
  kubernetes_host="https://$KUBERNETES_SERVICE_HOST:$KUBERNETES_SERVICE_PORT" \
  kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
  token_reviewer_jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token
```

## Secret Rotation

Secrets are automatically rotated every 30 days. Configure rotation policies:

```bash
vault write secret/config/rotation \
  auto_rotate=true \
  rotate_interval=2592000  # 30 days in seconds
```

## Access Control

Secrets are accessed via Kubernetes service account authentication.

## Audit Logging

All secret access is logged to `/vault/logs/audit.log`.

## Local Development

For local development, use environment variables or `.env` file.

## Emergency Access

In case of emergency, use break-glass procedure with root token.
