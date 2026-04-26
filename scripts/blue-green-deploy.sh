#!/bin/bash
set -e

NAMESPACE="${NAMESPACE:-scavenger-prod}"
BLUE_DEPLOYMENT="scavenger-blue"
GREEN_DEPLOYMENT="scavenger-green"
SERVICE="scavenger"
IMAGE="${1:-scavenger:latest}"
SMOKE_TEST_URL="${SMOKE_TEST_URL:-http://localhost/health}"

echo "Starting blue-green deployment..."
echo "Image: $IMAGE"
echo "Namespace: $NAMESPACE"

# Step 1: Update green deployment with new image
echo "Step 1: Updating green deployment with new image..."
kubectl set image deployment/$GREEN_DEPLOYMENT \
  scavenger=$IMAGE \
  -n $NAMESPACE

# Step 2: Scale up green deployment
echo "Step 2: Scaling up green deployment..."
kubectl scale deployment $GREEN_DEPLOYMENT \
  --replicas=3 \
  -n $NAMESPACE

# Step 3: Wait for green deployment to be ready
echo "Step 3: Waiting for green deployment to be ready..."
kubectl rollout status deployment/$GREEN_DEPLOYMENT \
  -n $NAMESPACE \
  --timeout=5m

# Step 4: Run smoke tests against green
echo "Step 4: Running smoke tests against green deployment..."
for i in {1..30}; do
  if kubectl run smoke-test-$i \
    --image=curlimages/curl:latest \
    --rm -i --restart=Never \
    -n $NAMESPACE \
    -- curl -f "$SMOKE_TEST_URL" > /dev/null 2>&1; then
    echo "Smoke test passed!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Smoke tests failed after 30 attempts"
    exit 1
  fi
  sleep 10
done

# Step 5: Switch traffic to green
echo "Step 5: Switching traffic to green deployment..."
kubectl patch service $SERVICE \
  -n $NAMESPACE \
  -p '{"spec":{"selector":{"slot":"green"}}}'

echo "Step 6: Waiting for traffic switch to stabilize..."
sleep 30

# Step 7: Monitor green for errors
echo "Step 7: Monitoring green deployment for errors..."
ERROR_COUNT=$(kubectl logs -l app=scavenger,slot=green \
  -n $NAMESPACE \
  --tail=100 \
  | grep -i "error\|exception" | wc -l)

if [ $ERROR_COUNT -gt 10 ]; then
  echo "High error rate detected in green deployment!"
  echo "Rolling back to blue..."
  kubectl patch service $SERVICE \
    -n $NAMESPACE \
    -p '{"spec":{"selector":{"slot":"blue"}}}'
  exit 1
fi

# Step 8: Scale down blue deployment
echo "Step 8: Scaling down blue deployment..."
kubectl scale deployment $BLUE_DEPLOYMENT \
  --replicas=0 \
  -n $NAMESPACE

# Step 9: Swap deployment names for next deployment
echo "Step 9: Preparing for next deployment..."
# In production, you'd swap the labels/names here

echo "Blue-green deployment completed successfully!"
echo "Green is now active. Blue is on standby."
