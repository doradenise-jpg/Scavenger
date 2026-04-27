# Security Best Practices Guide

## Overview

This guide documents security best practices for developers and users of the Scavenger platform, following OWASP guidelines and Stellar security standards.

## Secure Coding Guidelines

### Input Validation

#### Whitelist Approach

```rust
// Bad: Blacklist approach
fn validate_waste_type(waste_type: &str) -> bool {
    !waste_type.contains("DROP") && !waste_type.contains("DELETE")
}

// Good: Whitelist approach
fn validate_waste_type(waste_type: &str) -> Result<WasteType, Error> {
    match waste_type {
        "plastic" => Ok(WasteType::Plastic),
        "metal" => Ok(WasteType::Metal),
        "paper" => Ok(WasteType::Paper),
        "glass" => Ok(WasteType::Glass),
        _ => Err(Error::InvalidWasteType),
    }
}
```

#### Coordinate Validation

```rust
fn validate_coordinates(lat: f64, lon: f64) -> Result<(), Error> {
    if lat < -90.0 || lat > 90.0 {
        return Err(Error::InvalidLatitude);
    }
    if lon < -180.0 || lon > 180.0 {
        return Err(Error::InvalidLongitude);
    }
    Ok(())
}
```

#### Weight Validation

```rust
const MIN_WEIGHT: u128 = 1;
const MAX_WEIGHT: u128 = u128::MAX;

fn validate_weight(weight: u128) -> Result<(), Error> {
    if weight < MIN_WEIGHT {
        return Err(Error::WeightTooSmall);
    }
    if weight > MAX_WEIGHT {
        return Err(Error::WeightTooLarge);
    }
    Ok(())
}
```

### SQL Injection Prevention

```rust
// Bad: String concatenation
let query = format!("SELECT * FROM participants WHERE address = '{}'", user_input);

// Good: Parameterized queries
let participant = sqlx::query_as::<_, Participant>(
    "SELECT * FROM participants WHERE address = $1"
)
.bind(user_input)
.fetch_optional(&pool)
.await?;
```

### Cross-Site Scripting (XSS) Prevention

```typescript
// Bad: Direct HTML injection
const html = `<div>${userInput}</div>`;
element.innerHTML = html;

// Good: Use textContent or sanitize
element.textContent = userInput;

// Or use DOMPurify for HTML content
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
element.innerHTML = clean;
```

### Cryptographic Operations

```rust
use sha2::{Sha256, Digest};
use rand::Rng;

// Hash passwords with salt
fn hash_password(password: &str) -> Result<String, Error> {
    let salt = rand::thread_rng().gen::<[u8; 32]>();
    let mut hasher = Sha256::new();
    hasher.update(&salt);
    hasher.update(password.as_bytes());
    let hash = hasher.finalize();
    
    Ok(format!("{}${}", hex::encode(salt), hex::encode(hash)))
}

// Verify password
fn verify_password(password: &str, hash: &str) -> Result<bool, Error> {
    let parts: Vec<&str> = hash.split('$').collect();
    if parts.len() != 2 {
        return Err(Error::InvalidHash);
    }
    
    let salt = hex::decode(parts[0])?;
    let mut hasher = Sha256::new();
    hasher.update(&salt);
    hasher.update(password.as_bytes());
    let computed_hash = hex::encode(hasher.finalize());
    
    Ok(computed_hash == parts[1])
}
```

### Error Handling

```rust
// Bad: Expose internal details
pub fn get_participant(id: &str) -> Result<Participant, String> {
    match db.query(id) {
        Ok(p) => Ok(p),
        Err(e) => Err(format!("Database error: {}", e)), // Exposes DB details
    }
}

// Good: Generic error messages
pub fn get_participant(id: &str) -> Result<Participant, Error> {
    match db.query(id) {
        Ok(p) => Ok(p),
        Err(_) => Err(Error::NotFound), // Generic message
    }
}

// Log details internally
pub fn get_participant(id: &str) -> Result<Participant, Error> {
    match db.query(id) {
        Ok(p) => Ok(p),
        Err(e) => {
            error!("Database error for participant {}: {}", id, e);
            Err(Error::NotFound)
        }
    }
}
```

## Authentication Best Practices

### Stellar Wallet Integration

```typescript
// Use Stellar SDK for secure authentication
import StellarSdk from 'stellar-sdk';

async function authenticateWithWallet() {
  const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
  
  // Generate challenge
  const challenge = StellarSdk.Utils.buildChallenge({
    serverPublicKey: SERVER_PUBLIC_KEY,
    clientPublicKey: userPublicKey,
    homeDomain: 'scavenger.app',
    web_auth_domain: 'scavenger.app',
    timeout: 300,
  });
  
  // User signs challenge with their wallet
  const signedChallenge = await wallet.signTransaction(challenge);
  
  // Verify signature server-side
  const keypair = StellarSdk.Keypair.fromPublicKey(userPublicKey);
  const valid = keypair.verify(
    challenge.hash(),
    signedChallenge.signature
  );
  
  if (valid) {
    // Issue JWT token
    const token = jwt.sign(
      { address: userPublicKey },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    return token;
  }
}
```

### Session Management

```typescript
// Secure session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // HTTPS only
    httpOnly: true,      // No JavaScript access
    sameSite: 'strict',  // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

app.use(session(sessionConfig));
```

### Multi-Factor Authentication

```typescript
// TOTP implementation
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

async function setupTOTP(userId: string) {
  const secret = speakeasy.generateSecret({
    name: `Scavenger (${userId})`,
    issuer: 'Scavenger',
    length: 32,
  });
  
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  
  return {
    secret: secret.base32,
    qrCode,
  };
}

function verifyTOTP(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  });
}
```

## Data Protection Guidelines

### Encryption at Rest

```rust
use aes_gcm::{Aes256Gcm, Key, Nonce};
use rand::Rng;

fn encrypt_sensitive_data(data: &str, key: &[u8; 32]) -> Result<Vec<u8>, Error> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let nonce_bytes = rand::thread_rng().gen::<[u8; 12]>();
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = cipher
        .encrypt(nonce, data.as_bytes())
        .map_err(|_| Error::EncryptionFailed)?;
    
    // Prepend nonce to ciphertext
    let mut result = nonce_bytes.to_vec();
    result.extend(ciphertext);
    Ok(result)
}

fn decrypt_sensitive_data(encrypted: &[u8], key: &[u8; 32]) -> Result<String, Error> {
    if encrypted.len() < 12 {
        return Err(Error::InvalidEncrypted);
    }
    
    let (nonce_bytes, ciphertext) = encrypted.split_at(12);
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let nonce = Nonce::from_slice(nonce_bytes);
    
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| Error::DecryptionFailed)?;
    
    Ok(String::from_utf8(plaintext)?)
}
```

### Encryption in Transit

```rust
// Use HTTPS/TLS for all communications
// Cargo.toml
[dependencies]
actix-web = "4"
rustls = "0.21"

// src/main.rs
use actix_web::HttpServer;
use rustls::ServerConfig;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config = ServerConfig::builder()
        .with_safe_defaults()
        .with_no_client_auth()
        .with_single_cert(certs, key)?;
    
    HttpServer::new(|| App::new().service(routes))
        .bind_rustls("0.0.0.0:443", config)?
        .run()
        .await
}
```

### Data Minimization

```rust
// Only collect necessary data
pub struct Participant {
    pub address: Address,           // Required
    pub role: ParticipantRole,      // Required
    pub name: String,               // Required
    pub lat: f64,                   // Required
    pub lon: f64,                   // Required
    // Don't store: passwords, SSN, credit cards, etc.
}

// Implement data retention policies
pub async fn delete_old_data(days: i64) -> Result<(), Error> {
    sqlx::query(
        "DELETE FROM waste WHERE created_at < NOW() - INTERVAL '? days'"
    )
    .bind(days)
    .execute(&pool)
    .await?;
    
    Ok(())
}
```

## Wallet Security Guide

### For Users

#### Private Key Management

1. **Never Share Your Private Key**
   - Your private key is like your password
   - Anyone with it can access your funds
   - Never paste it into websites or apps

2. **Secure Storage**
   - Use hardware wallets (Ledger, Trezor)
   - Use encrypted password managers
   - Keep backups in secure locations
   - Never store in plain text

3. **Backup Strategy**
   - Write down seed phrase on paper
   - Store in safe deposit box
   - Keep multiple copies in different locations
   - Never photograph or digitize seed phrase

#### Wallet Best Practices

```
✓ Use official Stellar wallets
✓ Verify URLs before entering credentials
✓ Enable 2FA on wallet accounts
✓ Keep wallet software updated
✓ Use strong, unique passwords
✓ Review transaction details before signing

✗ Don't use public WiFi for wallet access
✗ Don't share seed phrases
✗ Don't use browser extensions from unknown sources
✗ Don't click suspicious links
✗ Don't store keys in email or cloud
```

### For Developers

#### Secure Key Handling

```typescript
// Bad: Hardcoded keys
const PRIVATE_KEY = "SBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

// Good: Environment variables
const PRIVATE_KEY = process.env.STELLAR_PRIVATE_KEY;

// Better: Key management service
import AWS from 'aws-sdk';
const secretsManager = new AWS.SecretsManager();

async function getPrivateKey() {
  const secret = await secretsManager.getSecretValue({
    SecretId: 'stellar/private-key',
  }).promise();
  
  return secret.SecretString;
}
```

#### Transaction Signing

```typescript
// Always verify transaction details before signing
async function signTransaction(transaction: Transaction) {
  // Display transaction details to user
  console.log('Transaction Details:');
  console.log(`- Destination: ${transaction.destination}`);
  console.log(`- Amount: ${transaction.amount} XLM`);
  console.log(`- Fee: ${transaction.fee} stroops`);
  
  // Get user confirmation
  const confirmed = await getUserConfirmation();
  
  if (!confirmed) {
    throw new Error('Transaction cancelled by user');
  }
  
  // Sign with wallet
  return wallet.signTransaction(transaction);
}
```

## Common Vulnerabilities

### OWASP Top 10

| Vulnerability | Prevention | Example |
|---------------|-----------|---------|
| Injection | Parameterized queries | Use sqlx with $1, $2 |
| Broken Auth | Strong auth, MFA | Stellar wallet + TOTP |
| Sensitive Data | Encryption, HTTPS | AES-256 + TLS 1.3 |
| XML External Entities | Disable XXE | Don't parse untrusted XML |
| Broken Access Control | Role-based access | Check role before action |
| Security Misconfiguration | Secure defaults | HTTPS, secure cookies |
| XSS | Input sanitization | DOMPurify, textContent |
| Insecure Deserialization | Validate input | Type checking |
| Using Components with Known Vulnerabilities | Update dependencies | `cargo audit` |
| Insufficient Logging | Comprehensive logging | Log security events |

### Contract-Specific Vulnerabilities

#### Reentrancy

```rust
// Bad: Vulnerable to reentrancy
pub fn transfer_and_reward(env: &Env, to: Address, amount: u128) -> Result<(), Error> {
    transfer_tokens(&env, to, amount)?;  // External call
    update_stats(&env, to, amount)?;     // State change after external call
    Ok(())
}

// Good: State change before external call
pub fn transfer_and_reward(env: &Env, to: Address, amount: u128) -> Result<(), Error> {
    update_stats(&env, to, amount)?;     // State change first
    transfer_tokens(&env, to, amount)?;  // External call after
    Ok(())
}
```

#### Integer Overflow

```rust
// Bad: Potential overflow
pub fn add_weight(env: &Env, waste_id: u64, weight: u128) -> Result<(), Error> {
    let current = get_weight(&env, waste_id)?;
    let new_weight = current + weight;  // Could overflow
    set_weight(&env, waste_id, new_weight)?;
    Ok(())
}

// Good: Check for overflow
pub fn add_weight(env: &Env, waste_id: u64, weight: u128) -> Result<(), Error> {
    let current = get_weight(&env, waste_id)?;
    let new_weight = current.checked_add(weight)
        .ok_or(Error::Overflow)?;
    set_weight(&env, waste_id, new_weight)?;
    Ok(())
}
```

## Security Checklist

### Development

- [ ] Input validation on all user inputs
- [ ] Parameterized queries for database
- [ ] HTTPS/TLS for all communications
- [ ] Secure password hashing (SHA-256 + salt)
- [ ] No hardcoded secrets
- [ ] Error messages don't expose details
- [ ] Logging of security events
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Dependencies audited

### Deployment

- [ ] Secrets in environment variables
- [ ] Database encryption enabled
- [ ] Backups encrypted and tested
- [ ] Firewall rules configured
- [ ] SSH key-based authentication
- [ ] Regular security updates
- [ ] Monitoring and alerting active
- [ ] Incident response plan ready
- [ ] Security headers configured
- [ ] WAF rules in place

### Operations

- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Vulnerability scanning
- [ ] Access control reviews
- [ ] Incident response drills
- [ ] Security training for team
- [ ] Compliance checks
- [ ] Backup restoration tests
- [ ] Disaster recovery plan
- [ ] Security documentation updated

## Incident Response Plan

### Detection

1. Monitor security alerts
2. Review logs for suspicious activity
3. Check system performance anomalies
4. Verify user reports

### Response

1. **Isolate**: Disconnect affected systems
2. **Assess**: Determine scope and impact
3. **Contain**: Prevent further damage
4. **Eradicate**: Remove threat
5. **Recover**: Restore systems
6. **Review**: Post-incident analysis

### Communication

- Notify affected users within 24 hours
- Provide clear guidance on actions to take
- Update status regularly
- Publish post-incident report

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Stellar Security](https://developers.stellar.org/docs/learn/security)
- [Rust Security](https://anssi-fr.github.io/rust-guide/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE Top 25](https://cwe.mitre.org/top25/)

## References

- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [Stellar Best Practices](https://developers.stellar.org/docs/learn/best-practices)
- [Rust Security Guidelines](https://anssi-fr.github.io/rust-guide/01_introduction.html)
- [Web Security Academy](https://portswigger.net/web-security)
