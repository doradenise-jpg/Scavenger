use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

#[derive(Clone)]
struct CacheEntry {
    data: Vec<u8>,
    expires_at: Instant,
}

#[derive(Clone)]
pub struct Cache {
    store: Arc<Mutex<HashMap<String, CacheEntry>>>,
    default_ttl: Duration,
}

impl Cache {
    pub fn new(default_ttl_secs: u64) -> Self {
        Self {
            store: Arc::new(Mutex::new(HashMap::new())),
            default_ttl: Duration::from_secs(default_ttl_secs),
        }
    }

    pub fn get(&self, key: &str) -> Option<Vec<u8>> {
        let store = self.store.lock().ok()?;
        if let Some(entry) = store.get(key) {
            if entry.expires_at > Instant::now() {
                return Some(entry.data.clone());
            }
        }
        None
    }

    pub fn set(&self, key: String, data: Vec<u8>) {
        self.set_with_ttl(key, data, self.default_ttl);
    }

    pub fn set_with_ttl(&self, key: String, data: Vec<u8>, ttl: Duration) {
        if let Ok(mut store) = self.store.lock() {
            store.insert(
                key,
                CacheEntry {
                    data,
                    expires_at: Instant::now() + ttl,
                },
            );
        }
    }

    pub fn invalidate(&self, key: &str) {
        if let Ok(mut store) = self.store.lock() {
            store.remove(key);
        }
    }

    pub fn clear(&self) {
        if let Ok(mut store) = self.store.lock() {
            store.clear();
        }
    }

    pub fn cleanup(&self) {
        if let Ok(mut store) = self.store.lock() {
            store.retain(|_, entry| entry.expires_at > Instant::now());
        }
    }

    pub fn len(&self) -> usize {
        self.store.lock().map(|s| s.len()).unwrap_or(0)
    }

    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_set_get() {
        let cache = Cache::new(60);
        cache.set("key1".to_string(), b"value1".to_vec());
        assert_eq!(cache.get("key1"), Some(b"value1".to_vec()));
    }

    #[test]
    fn test_cache_miss() {
        let cache = Cache::new(60);
        assert_eq!(cache.get("nonexistent"), None);
    }

    #[test]
    fn test_cache_invalidate() {
        let cache = Cache::new(60);
        cache.set("key1".to_string(), b"value1".to_vec());
        cache.invalidate("key1");
        assert_eq!(cache.get("key1"), None);
    }

    #[test]
    fn test_cache_clear() {
        let cache = Cache::new(60);
        cache.set("key1".to_string(), b"value1".to_vec());
        cache.set("key2".to_string(), b"value2".to_vec());
        cache.clear();
        assert_eq!(cache.get("key1"), None);
        assert_eq!(cache.get("key2"), None);
    }

    #[test]
    fn test_cache_with_ttl() {
        let cache = Cache::new(60);
        cache.set_with_ttl("key1".to_string(), b"value1".to_vec(), Duration::from_secs(0));
        std::thread::sleep(Duration::from_millis(10));
        assert_eq!(cache.get("key1"), None);
    }

    #[test]
    fn test_cache_len() {
        let cache = Cache::new(60);
        assert_eq!(cache.len(), 0);
        cache.set("key1".to_string(), b"v1".to_vec());
        assert_eq!(cache.len(), 1);
    }
}
