# Troubleshooting Guide

## Overview

This guide provides solutions for common issues encountered when using and developing the Scavenger platform.

## Common Errors and Solutions

### Error Code Reference

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| E001 | Participant not registered | User hasn't registered | Register participant first |
| E002 | Invalid waste type | Unknown waste type | Use: plastic, metal, paper, glass |
| E003 | Invalid coordinates | Lat/lon out of range | Lat: [-90, 90], Lon: [-180, 180] |
| E004 | Insufficient balance | Not enough tokens | Earn tokens through verification |
| E005 | Unauthorized action | Permission denied | Check participant role |
| E006 | Contract error | Contract execution failed | Check network and contract state |
| E007 | Invalid signature | Transaction signature invalid | Verify wallet connection |
| E008 | Network error | Connection failed | Check internet and RPC endpoint |

## Wallet Connection Issues

### Problem: Wallet Not Connecting

**Symptoms:**
- "Connect Wallet" button not responding
- Wallet extension not detected
- Connection timeout

**Diagnosis:**
```bash
# Check if wallet extension is installed
# Open browser console (F12)
console.log(window.stellar)  # Should not be undefined
```

**Solutions:**

1. **Install Wallet Extension**
   - Download [Stellar Expert Wallet](https://stellar.expert/wallet)
   - Or [Freighter Wallet](https://www.freighter.app/)
   - Restart browser after installation

2. **Enable Extension**
   - Go to browser extensions
   - Ensure wallet extension is enabled
   - Check permissions for scavenger.app

3. **Clear Browser Cache**
   ```bash
   # Chrome: Ctrl+Shift+Delete
   # Firefox: Ctrl+Shift+Delete
   # Safari: Cmd+Shift+Delete
   ```

4. **Check Network**
   ```bash
   # Verify RPC endpoint is accessible
   curl https://soroban-testnet.stellar.org/
   ```

### Problem: Transaction Signing Failed

**Symptoms:**
- "Failed to sign transaction" error
- Wallet popup doesn't appear
- Transaction rejected

**Solutions:**

1. **Verify Wallet is Unlocked**
   - Open wallet extension
   - Enter password if needed
   - Ensure account is selected

2. **Check Transaction Details**
   - Verify destination address is correct
   - Check amount is reasonable
   - Confirm fee is acceptable

3. **Restart Wallet**
   - Close wallet extension
   - Refresh browser page
   - Reopen wallet extension

4. **Check Network**
   ```bash
   # Verify you're on correct network
   # Should be TESTNET or MAINNET
   ```

## Transaction Failures

### Problem: Transaction Rejected

**Symptoms:**
- "Transaction failed" error
- Transaction appears in history but marked as failed
- No error message provided

**Diagnosis:**
```bash
# Check transaction status
curl "https://horizon-testnet.stellar.org/transactions/<TRANSACTION_ID>"

# Look for error_code and error_details
```

**Solutions:**

1. **Insufficient Balance**
   - Check account balance: `stellar account info <ADDRESS>`
   - Fund account: Use Friendbot for testnet
   - Wait for transaction confirmation

2. **Invalid Parameters**
   - Verify waste type is valid
   - Check coordinates are in range
   - Ensure weight is positive

3. **Contract Error**
   - Check contract is deployed
   - Verify contract ID is correct
   - Check contract state

4. **Network Congestion**
   - Wait and retry
   - Increase fee if needed
   - Check Stellar network status

### Problem: Transaction Timeout

**Symptoms:**
- Transaction pending for > 5 minutes
- No confirmation received
- "Timeout" error message

**Solutions:**

1. **Check Transaction Status**
   ```bash
   # Query Horizon
   curl "https://horizon-testnet.stellar.org/transactions/<TRANSACTION_ID>"
   
   # If not found, transaction may have failed
   ```

2. **Resubmit Transaction**
   - Wait 30 seconds
   - Retry with same parameters
   - Use new transaction if needed

3. **Check Network**
   ```bash
   # Verify network is operational
   curl https://horizon-testnet.stellar.org/
   
   # Check Stellar status page
   # https://status.stellar.org/
   ```

4. **Increase Fee**
   - Retry with higher fee
   - Standard fee: 100 stroops
   - High fee: 1000 stroops

## Network Issues

### Problem: Cannot Connect to Network

**Symptoms:**
- "Network error" or "Connection refused"
- RPC endpoint unreachable
- Timeout errors

**Diagnosis:**
```bash
# Test RPC endpoint
curl -v https://soroban-testnet.stellar.org/

# Check DNS resolution
nslookup soroban-testnet.stellar.org

# Test network connectivity
ping 8.8.8.8
```

**Solutions:**

1. **Check Internet Connection**
   ```bash
   # Verify connectivity
   ping google.com
   
   # If fails, restart router/modem
   ```

2. **Verify RPC Endpoint**
   - Check endpoint URL is correct
   - Verify endpoint is operational
   - Try alternative endpoint

3. **Check Firewall**
   ```bash
   # Verify port 443 is open
   telnet soroban-testnet.stellar.org 443
   ```

4. **Use VPN if Blocked**
   - Some networks block Stellar endpoints
   - Use VPN to bypass restrictions
   - Contact network administrator

### Problem: Slow Network Performance

**Symptoms:**
- Requests taking > 10 seconds
- High latency
- Frequent timeouts

**Solutions:**

1. **Check Network Speed**
   ```bash
   # Test download speed
   speedtest-cli
   
   # Minimum: 1 Mbps
   # Recommended: 10 Mbps
   ```

2. **Reduce Load**
   - Close other applications
   - Stop large downloads
   - Disable VPN if using

3. **Use Faster Endpoint**
   - Try different RPC endpoint
   - Use regional endpoint closer to you
   - Check endpoint status

4. **Optimize Queries**
   - Reduce batch size
   - Use pagination
   - Cache results

## Contract Interaction Errors

### Problem: Contract Call Fails

**Symptoms:**
- "Contract error" message
- Transaction fails with contract error
- No specific error details

**Diagnosis:**
```bash
# Check contract state
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- get_metrics

# Check contract logs
docker logs scavenger-contract
```

**Solutions:**

1. **Verify Contract Deployment**
   ```bash
   # Check if contract exists
   soroban contract info --id <CONTRACT_ID> --network testnet
   
   # If not found, redeploy contract
   ```

2. **Check Contract State**
   - Verify admin is initialized
   - Check token address is set
   - Ensure participant is registered

3. **Verify Parameters**
   - Check all required parameters provided
   - Verify parameter types match
   - Ensure values are in valid range

4. **Check Gas**
   - Increase gas limit
   - Optimize contract code
   - Batch operations if possible

### Problem: Participant Not Found

**Symptoms:**
- "Participant not registered" error
- Cannot retrieve participant info
- Operations fail for participant

**Solutions:**

1. **Register Participant**
   ```bash
   soroban contract invoke \
     --id <CONTRACT_ID> \
     --source participant \
     --network testnet \
     -- register_participant \
     --address <ADDRESS> \
     --role 0 \
     --name "Name" \
     --lat 40.7128 \
     --lon -74.0060
   ```

2. **Verify Registration**
   ```bash
   soroban contract invoke \
     --id <CONTRACT_ID> \
     --source participant \
     --network testnet \
     -- is_participant_registered \
     --address <ADDRESS>
   ```

3. **Check Address Format**
   - Ensure address is valid Stellar address
   - Verify address is not truncated
   - Check for typos

## Performance Issues

### Problem: Slow Application

**Symptoms:**
- UI is sluggish
- Page loads slowly
- High CPU/memory usage

**Diagnosis:**
```bash
# Check browser performance
# Open DevTools (F12)
# Go to Performance tab
# Record and analyze

# Check system resources
top
free -h
df -h
```

**Solutions:**

1. **Clear Browser Cache**
   - Ctrl+Shift+Delete (Windows/Linux)
   - Cmd+Shift+Delete (Mac)
   - Select "All time"

2. **Disable Extensions**
   - Disable browser extensions
   - Restart browser
   - Re-enable one by one

3. **Optimize Network**
   - Use faster internet
   - Close other applications
   - Disable VPN if possible

4. **Update Application**
   - Clear cache: `npm run clean`
   - Rebuild: `npm run build`
   - Restart: `npm run dev`

### Problem: High Memory Usage

**Symptoms:**
- Application crashes
- Browser becomes unresponsive
- "Out of memory" errors

**Solutions:**

1. **Check Memory Leaks**
   ```bash
   # Use Chrome DevTools
   # Memory tab > Take heap snapshot
   # Compare snapshots over time
   ```

2. **Reduce Data**
   - Implement pagination
   - Use virtual scrolling
   - Limit query results

3. **Optimize Code**
   - Remove unused dependencies
   - Implement lazy loading
   - Use code splitting

4. **Restart Application**
   - Close and reopen browser
   - Clear cache
   - Restart development server

## Debug Mode Guide

### Enable Debug Logging

```typescript
// src/config.ts
export const DEBUG = process.env.VITE_DEBUG === 'true';

// src/main.tsx
if (DEBUG) {
  console.log('Debug mode enabled');
  window.DEBUG = true;
}
```

### Debug Commands

```bash
# Enable debug mode
export VITE_DEBUG=true
npm run dev

# Check logs
tail -f logs/app.log

# Monitor network
# Open DevTools > Network tab
```

### Diagnostic Commands

```bash
# Check contract state
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- get_metrics

# Check participant
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- get_participant \
  --address <ADDRESS>

# Check waste
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- get_waste \
  --waste_id 1
```

## FAQ

### Q: How do I reset my account?

**A:** You cannot reset your Stellar account. Create a new account:
1. Generate new keypair: `soroban keys generate new-account`
2. Fund new account: Use Friendbot for testnet
3. Register as new participant

### Q: How do I recover a lost private key?

**A:** You cannot recover a lost private key. If you have a seed phrase:
1. Import seed phrase into wallet
2. Recover account access
3. Transfer funds to new account if needed

### Q: Why is my transaction pending?

**A:** Transactions typically confirm in 3-5 seconds. If pending longer:
1. Check transaction status on Horizon
2. Verify network is operational
3. Retry with higher fee if needed

### Q: How do I increase transaction fee?

**A:** Resubmit transaction with higher fee:
```bash
# Standard: 100 stroops
# High: 1000 stroops
# Very High: 10000 stroops
```

### Q: Can I cancel a transaction?

**A:** No, transactions cannot be cancelled once submitted. You can:
1. Wait for confirmation
2. Resubmit with different parameters
3. Create new transaction to reverse effects

### Q: How do I report a bug?

**A:** Report bugs on GitHub:
1. Go to [Issues](https://github.com/Xoulomon/Scavenger/issues)
2. Click "New Issue"
3. Provide:
   - Description of issue
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/logs if applicable

### Q: How do I get help?

**A:** Get help through:
1. **Documentation**: Read guides and API docs
2. **GitHub Issues**: Search existing issues
3. **Community**: Join Stellar Discord
4. **Support**: Contact support@scavenger.app

## Diagnostic Checklist

- [ ] Internet connection working
- [ ] Wallet extension installed and enabled
- [ ] Correct network selected (TESTNET/MAINNET)
- [ ] Account has sufficient balance
- [ ] Participant is registered
- [ ] Contract is deployed
- [ ] RPC endpoint is accessible
- [ ] Browser cache cleared
- [ ] No browser extensions interfering
- [ ] System has sufficient resources

## Getting More Help

### Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://developers.stellar.org/docs/learn/soroban)
- [GitHub Issues](https://github.com/Xoulomon/Scavenger/issues)
- [Stellar Discord](https://discord.gg/stellar)

### Reporting Issues

When reporting issues, include:
1. Error message (exact text)
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Browser/OS version
6. Network (TESTNET/MAINNET)
7. Screenshots/logs if applicable

### Contact Support

- **Email**: support@scavenger.app
- **Discord**: [Stellar Community](https://discord.gg/stellar)
- **GitHub**: [Issues](https://github.com/Xoulomon/Scavenger/issues)
- **Twitter**: [@ScavengerApp](https://twitter.com/ScavengerApp)

## Troubleshooting Flowchart

```
Issue Encountered
    ↓
Is it a wallet issue?
    ├─ Yes → Check Wallet Connection Issues
    └─ No → Continue
    ↓
Is it a transaction issue?
    ├─ Yes → Check Transaction Failures
    └─ No → Continue
    ↓
Is it a network issue?
    ├─ Yes → Check Network Issues
    └─ No → Continue
    ↓
Is it a contract issue?
    ├─ Yes → Check Contract Interaction Errors
    └─ No → Continue
    ↓
Is it a performance issue?
    ├─ Yes → Check Performance Issues
    └─ No → Continue
    ↓
Check FAQ and Resources
    ↓
Report Issue on GitHub
```
