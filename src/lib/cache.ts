// Simple in-memory cache with TTL for frontend API responses
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

class FrontendCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private ttl: number = 30 * 60 * 1000; // 30 minutes in milliseconds

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      // Expired
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
    console.log('🧹 Cache do frontend limpo');
  }

  // Limpar cache e retornar número de entradas removidas
  clearWithStats(): number {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🧹 Cache do frontend limpo: ${size} entradas removidas`);
    return size;
  }

  // Generate cache key from parameters
  generateKey(endpoint: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}?${sortedParams}`;
  }
}

export const frontendCache = new FrontendCache();

