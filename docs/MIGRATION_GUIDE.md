# Scavngr Migration Guide

## Overview

This guide provides step-by-step instructions for upgrading Scavngr between versions while preserving data integrity and minimizing downtime.

---

## Version Compatibility Matrix

| From Version | To Version | Breaking Changes | Data Migration | Downtime | Effort |
|---|---|---|---|---|---|
| v1.0.x | v1.1.x | No | Optional | None | Low |
| v1.1.x | v1.2.x | No | Optional | None | Low |
| v1.0.x | v2.0.0 | Yes | Required | ~1 hour | High |
| v2.0.x | v2.1.x | No | Optional | None | Low |

**Legend:**
- **Breaking Changes**: API or data structure incompatibilities
- **Data Migration**: Whether data transformation is required
- **Downtime**: Expected service unavailability
- **Effort**: Implementation complexity

---

## Breaking Changes by Version

### v2.0.0 (Major Release)

**Participant Storage Format**
- Old: Flat structure with inline stats
- New: Separated participant and stats storage
- Impact: Requires data transformation

**Incentive Budget Tracking**
- Old: Single budget field
- New: Budget with spent amount tracking
- Impact: Requires budget recalculation

**Transfer History**
- Old: Stored in waste record
- New: Separate transfer history storage
- Impact: Requires data extraction and reorganization

### v1.1.0 (Minor Release)

**Waste Type Enum**
- Added: `Organic` waste type
- Impact: No breaking changes, backward compatible

**Reward Distribution**
- Added: Configurable percentages
- Impact: No breaking changes, defaults to 50/50 split

---

## Pre-Migration Checklist

- [ ] Backup all contract state and data
- [ ] Review breaking changes for your version
- [ ] Test migration in staging environment
- [ ] Notify users of planned maintenance
- [ ] Prepare rollback plan
- [ ] Document current system state
- [ ] Verify all participants are registered
- [ ] Check incentive budgets are accurate
- [ ] Validate transfer history completeness
- [ ] Schedule migration during low-traffic period

---

## Migration Steps

### Step 1: Backup Current State

```bash
# Export current contract state
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source <ADMIN_KEY> \
  --network <NETWORK> \
  -- get_metrics

# Save output to backup file
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source <ADMIN_KEY> \
  --network <NETWORK> \
  -- get_supply_chain_stats > backup_stats.json
```

### Step 2: Deploy New Contract Version

```bash
# Build new version
cd stellar-contract
cargo build --target wasm32-unknown-unknown --release

# Optimize WASM
soroban contract optimize \
  --wasm target/wasm32-unknown-unknown/release/stellar_scavngr_contract.wasm

# Deploy to testnet first
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_scavngr_contract.optimized.wasm \
  --source testnet-deployer \
  --network testnet
```

### Step 3: Run Data Migration Scripts

#### For v1.x → v2.0.0 Migration

```bash
# Run migration script
./scripts/migrate-v1-to-v2.sh \
  --old-contract <OLD_CONTRACT_ID> \
  --new-contract <NEW_CONTRACT_ID> \
  --network <NETWORK> \
  --admin-key <ADMIN_KEY>
```

**Migration Script Contents** (`scripts/migrate-v1-to-v2.sh`):

```bash
#!/bin/bash

OLD_CONTRACT=$1
NEW_CONTRACT=$2
NETWORK=$3
ADMIN_KEY=$4

echo "Starting migration from v1 to v2..."

# Step 1: Migrate participants
echo "Migrating participants..."
soroban contract invoke \
  --id $OLD_CONTRACT \
  --source $ADMIN_KEY \
  --network $NETWORK \
  -- get_all_participants | jq '.[]' | while read participant; do
  
  soroban contract invoke \
    --id $NEW_CONTRACT \
    --source $ADMIN_KEY \
    --network $NETWORK \
    -- register_participant \
    --address $(echo $participant | jq -r '.address') \
    --role $(echo $participant | jq -r '.role') \
    --name $(echo $participant | jq -r '.name') \
    --lat $(echo $participant | jq -r '.lat') \
    --lon $(echo $participant | jq -r '.lon')
done

# Step 2: Migrate waste items
echo "Migrating waste items..."
soroban contract invoke \
  --id $OLD_CONTRACT \
  --source $ADMIN_KEY \
  --network $NETWORK \
  -- get_all_wastes | jq '.[]' | while read waste; do
  
  soroban contract invoke \
    --id $NEW_CONTRACT \
    --source $ADMIN_KEY \
    --network $NETWORK \
    -- submit_material \
    --submitter $(echo $waste | jq -r '.owner') \
    --waste_type $(echo $waste | jq -r '.waste_type') \
    --weight $(echo $waste | jq -r '.weight') \
    --lat $(echo $waste | jq -r '.lat') \
    --lon $(echo $waste | jq -r '.lon')
done

# Step 3: Migrate incentives
echo "Migrating incentives..."
soroban contract invoke \
  --id $OLD_CONTRACT \
  --source $ADMIN_KEY \
  --network $NETWORK \
  -- get_all_incentives | jq '.[]' | while read incentive; do
  
  soroban contract invoke \
    --id $NEW_CONTRACT \
    --source $ADMIN_KEY \
    --network $NETWORK \
    -- create_incentive \
    --rewarder $(echo $incentive | jq -r '.rewarder') \
    --waste_type $(echo $incentive | jq -r '.waste_type') \
    --reward_points $(echo $incentive | jq -r '.reward_points') \
    --budget $(echo $incentive | jq -r '.budget')
done

echo "Migration complete!"
```

### Step 4: Verify Data Integrity

```bash
# Compare metrics
echo "Old contract metrics:"
soroban contract invoke \
  --id <OLD_CONTRACT_ID> \
  --source <ADMIN_KEY> \
  --network <NETWORK> \
  -- get_metrics

echo "New contract metrics:"
soroban contract invoke \
  --id <NEW_CONTRACT_ID> \
  --source <ADMIN_KEY> \
  --network <NETWORK> \
  -- get_metrics

# Verify participant count
echo "Participant count verification:"
soroban contract invoke \
  --id <NEW_CONTRACT_ID> \
  --source <ADMIN_KEY> \
  --network <NETWORK> \
  -- get_all_participants | jq 'length'
```

### Step 5: Update Configuration

```bash
# Update environment variables
export VITE_CONTRACT_ID=<NEW_CONTRACT_ID>
export VITE_NETWORK=<NETWORK>

# Restart frontend
cd frontend
npm run build
npm run preview
```

### Step 6: Monitor and Validate

```bash
# Check contract health
soroban contract invoke \
  --id <NEW_CONTRACT_ID> \
  --source <ADMIN_KEY> \
  --network <NETWORK> \
  -- get_metrics

# Verify recent transactions
soroban contract invoke \
  --id <NEW_CONTRACT_ID> \
  --source <ADMIN_KEY> \
  --network <NETWORK> \
  -- get_supply_chain_stats
```

---

## Rollback Procedures

### Immediate Rollback (< 1 hour)

If critical issues are discovered immediately after migration:

```bash
# Revert to old contract ID in configuration
export VITE_CONTRACT_ID=<OLD_CONTRACT_ID>

# Restart frontend
cd frontend
npm run build
npm run preview

# Notify users of rollback
```

### Data Rollback (> 1 hour)

If data corruption is discovered:

1. **Stop all operations**
   ```bash
   # Pause contract (if pause function exists)
   soroban contract invoke \
     --id <NEW_CONTRACT_ID> \
     --source <ADMIN_KEY> \
     --network <NETWORK> \
     -- pause_contract
   ```

2. **Restore from backup**
   ```bash
   # Deploy old contract version
   soroban contract deploy \
     --wasm target/wasm32-unknown-unknown/release/stellar_scavngr_contract.v1.optimized.wasm \
     --source <ADMIN_KEY> \
     --network <NETWORK>
   ```

3. **Verify restoration**
   ```bash
   # Compare metrics with backup
   soroban contract invoke \
     --id <RESTORED_CONTRACT_ID> \
     --source <ADMIN_KEY> \
     --network <NETWORK> \
     -- get_metrics
   ```

---

## Data Migration Scripts

### Participant Migration

```rust
// Pseudo-code for participant migration
pub fn migrate_participants(
    env: &Env,
    old_contract: &Address,
    new_contract: &Address,
) -> Result<u32, Error> {
    let mut count = 0;
    
    // Get all participants from old contract
    let participants = old_contract.get_all_participants()?;
    
    for participant in participants {
        // Register in new contract
        new_contract.register_participant(
            participant.address,
            participant.role,
            participant.name,
            participant.lat,
            participant.lon,
        )?;
        count += 1;
    }
    
    Ok(count)
}
```

### Waste Migration

```rust
// Pseudo-code for waste migration
pub fn migrate_waste(
    env: &Env,
    old_contract: &Address,
    new_contract: &Address,
) -> Result<u32, Error> {
    let mut count = 0;
    
    // Get all waste items from old contract
    let wastes = old_contract.get_all_wastes()?;
    
    for waste in wastes {
        // Submit in new contract
        new_contract.submit_material(
            waste.owner,
            waste.waste_type,
            waste.weight,
            waste.lat,
            waste.lon,
        )?;
        count += 1;
    }
    
    Ok(count)
}
```

---

## Testing Checklist

- [ ] All participants migrated successfully
- [ ] All waste items accessible in new contract
- [ ] All incentives active and functional
- [ ] Transfer history preserved
- [ ] Statistics accurate
- [ ] Reward calculations correct
- [ ] Admin functions operational
- [ ] User registration works
- [ ] Waste submission works
- [ ] Transfer workflow works
- [ ] Incentive creation works
- [ ] No data loss detected

---

## FAQ

**Q: How long does migration take?**
A: Depends on data volume. Typically 30 minutes to 2 hours for full migration.

**Q: Will users experience downtime?**
A: Minimal downtime (< 5 minutes) for minor versions. Major versions may require 1-2 hours.

**Q: Can I migrate without losing data?**
A: Yes, all migration scripts preserve data. Always backup before migrating.

**Q: What if migration fails?**
A: Use rollback procedures to revert to previous version. No data is lost.

**Q: How do I verify migration success?**
A: Compare metrics and statistics between old and new contracts using provided verification scripts.

**Q: Can I migrate in production?**
A: Yes, but schedule during low-traffic periods and have rollback plan ready.

---

## Version-Specific Notes

### v1.0.x → v1.1.x
- No data migration required
- New waste type (Organic) available
- Configurable reward percentages
- Backward compatible

### v1.1.x → v1.2.x
- No data migration required
- Performance improvements
- New query functions
- Backward compatible

### v1.x → v2.0.0
- **BREAKING**: Storage format changed
- **REQUIRED**: Run migration scripts
- **REQUIRED**: Update configuration
- **REQUIRED**: Verify all data

---

## Support

For migration issues:
1. Check this guide's FAQ section
2. Review contract logs: `soroban contract logs <CONTRACT_ID>`
3. Consult [Disaster Recovery Plan](./DISASTER_RECOVERY_PLAN.md)
4. Contact development team with error details

---

## Related Documentation

- [Disaster Recovery Plan](./DISASTER_RECOVERY_PLAN.md)
- [Deployment Guide](./KUBERNETES_DEPLOYMENT.md)
- [Contract API](./CONTRACT_API.md)
- [Glossary](./GLOSSARY.md)
