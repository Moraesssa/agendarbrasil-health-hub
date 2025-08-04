/**
 * Location Cache Manager
 * Handles intelligent caching of location data with LRU eviction and warming strategies
 */

import { logger } from '@/utils/logger';
import { EnhancedLocation } from '@/types/location';

interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  priority: number;
  ttl?: number;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  averageAccessTime: number;
}

interface WarmUpTask {
  key: string;
  fetcher: () => Promise<any>;
  priority: number;
}

class LocationCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitCount: 0,
    missCount: 0,
    hitRate: 0,
    evictionCount: 0,
    averageAccessTime: 0
  };

  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly MAX_ENTRIES = 1000;
  private readonly DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const startTime = Date.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.missCount++;
      this.updateHitRate();
      return null;
    }

    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.missCount++;
      this.stats.evictionCount++;
      this.updateStats();
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.stats.hitCount++;
    this.updateHitRate();
    this.updateAverageAccessTime(Date.now() - startTime);

    logger.debug('Cache hit', 'locationCacheManager', { key, accessCount: entry.accessCount });
    return entry.data;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, options?: { ttl?: number; priority?: number }): void {
    const size = this.calculateSize(data);
    const ttl = options?.ttl || this.DEFAULT_TTL;
    const priority = options?.priority || 1;

    // Check if we need to make space
    this.ensureSpace(size);

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
      priority,
      ttl
    };

    this.cache.set(key, entry);
    this.updateStats();

    logger.debug('Cache set', 'locationCacheManager', { key, size, ttl });
  }

  /**
   * Remove specific entry from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
      logger.debug('Cache entry deleted', 'locationCacheManager', { key });
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const entriesCleared = this.cache.size;
    this.cache.clear();
    this.updateStats();
    
    logger.info('Cache cleared', 'locationCacheManager', { entriesCleared });
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp(tasks: WarmUpTask[]): Promise<void> {
    logger.info('Starting cache warm-up', 'locationCacheManager', { taskCount: tasks.length });

    // Sort tasks by priority (higher priority first)
    const sortedTasks = tasks.sort((a, b) => b.priority - a.priority);

    const warmUpPromises = sortedTasks.map(async (task) => {
      try {
        const data = await task.fetcher();
        this.set(task.key, data, { priority: task.priority });
        
        logger.debug('Cache warm-up task completed', 'locationCacheManager', { 
          key: task.key, 
          priority: task.priority 
        });
      } catch (error) {
        logger.error('Cache warm-up task failed', 'locationCacheManager', { 
          key: task.key, 
          error 
        });
      }
    });

    await Promise.allSettled(warmUpPromises);
    logger.info('Cache warm-up completed', 'locationCacheManager');
  }

  /**
   * Prefetch data for specific keys
   */
  async prefetch(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    const prefetchPromises = keys.map(async (key) => {
      if (!this.has(key)) {
        try {
          const data = await fetcher(key);
          this.set(key, data);
        } catch (error) {
          logger.error('Prefetch failed', 'locationCacheManager', { key, error });
        }
      }
    });

    await Promise.allSettled(prefetchPromises);
  }

  /**
   * Get cache keys matching pattern
   */
  getKeys(pattern?: RegExp): string[] {
    const keys = Array.from(this.cache.keys());
    
    if (pattern) {
      return keys.filter(key => pattern.test(key));
    }
    
    return keys;
  }

  /**
   * Get entries sorted by access frequency
   */
  getMostAccessed(limit: number = 10): Array<{ key: string; accessCount: number }> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, accessCount: entry.accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);

    return entries;
  }

  /**
   * Get entries that are about to expire
   */
  getExpiringEntries(withinMs: number = 5 * 60 * 1000): string[] {
    const now = Date.now();
    const expiringKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl) {
        const expiresAt = entry.timestamp + entry.ttl;
        if (expiresAt - now <= withinMs && expiresAt > now) {
          expiringKeys.push(key);
        }
      }
    }

    return expiringKeys;
  }

  /**
   * Extend TTL for specific entries
   */
  extendTTL(keys: string[], additionalMs: number): number {
    let extendedCount = 0;

    for (const key of keys) {
      const entry = this.cache.get(key);
      if (entry && entry.ttl) {
        entry.ttl += additionalMs;
        extendedCount++;
      }
    }

    logger.info('TTL extended for entries', 'locationCacheManager', { 
      extendedCount, 
      additionalMs 
    });

    return extendedCount;
  }

  /**
   * Optimize cache by removing least useful entries
   */
  optimize(): void {
    const entries = Array.from(this.cache.entries());
    
    // Calculate usefulness score for each entry
    const scoredEntries = entries.map(([key, entry]) => {
      const age = Date.now() - entry.timestamp;
      const timeSinceAccess = Date.now() - entry.lastAccessed;
      const accessFrequency = entry.accessCount / (age / (60 * 1000)); // accesses per minute
      
      // Higher score = more useful
      const score = (accessFrequency * entry.priority) / (timeSinceAccess / (60 * 1000));
      
      return { key, entry, score };
    });

    // Sort by score (lowest first for removal)
    scoredEntries.sort((a, b) => a.score - b.score);

    // Remove bottom 10% if cache is getting full
    const cacheUtilization = this.stats.totalSize / this.MAX_CACHE_SIZE;
    if (cacheUtilization > 0.8) {
      const removeCount = Math.floor(entries.length * 0.1);
      const toRemove = scoredEntries.slice(0, removeCount);
      
      for (const { key } of toRemove) {
        this.cache.delete(key);
        this.stats.evictionCount++;
      }

      this.updateStats();
      
      logger.info('Cache optimized', 'locationCacheManager', { 
        removedEntries: removeCount,
        cacheUtilization: cacheUtilization.toFixed(2)
      });
    }
  }

  // Private methods

  private isExpired(entry: CacheEntry<any>): boolean {
    if (!entry.ttl) return false;
    return Date.now() > (entry.timestamp + entry.ttl);
  }

  private calculateSize(data: any): number {
    // Simple size estimation
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  }

  private ensureSpace(requiredSize: number): void {
    // Check if we need to make space
    while (
      (this.stats.totalSize + requiredSize > this.MAX_CACHE_SIZE) ||
      (this.cache.size >= this.MAX_ENTRIES)
    ) {
      this.evictLeastUseful();
    }
  }

  private evictLeastUseful(): void {
    if (this.cache.size === 0) return;

    let leastUsefulKey: string | null = null;
    let lowestScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      const age = Date.now() - entry.timestamp;
      const timeSinceAccess = Date.now() - entry.lastAccessed;
      const accessFrequency = entry.accessCount / Math.max(age / (60 * 1000), 1);
      
      // Lower score = less useful
      const score = (accessFrequency * entry.priority) / Math.max(timeSinceAccess / (60 * 1000), 1);
      
      if (score < lowestScore) {
        lowestScore = score;
        leastUsefulKey = key;
      }
    }

    if (leastUsefulKey) {
      this.cache.delete(leastUsefulKey);
      this.stats.evictionCount++;
      
      logger.debug('Cache entry evicted', 'locationCacheManager', { 
        key: leastUsefulKey, 
        score: lowestScore 
      });
    }
  }

  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  private updateHitRate(): void {
    const totalRequests = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = totalRequests > 0 ? (this.stats.hitCount / totalRequests) * 100 : 0;
  }

  private updateAverageAccessTime(accessTime: number): void {
    const totalAccesses = this.stats.hitCount;
    if (totalAccesses === 1) {
      this.stats.averageAccessTime = accessTime;
    } else {
      this.stats.averageAccessTime = 
        (this.stats.averageAccessTime * (totalAccesses - 1) + accessTime) / totalAccesses;
    }
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanupExpiredEntries(): void {
    let cleanedCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.stats.evictionCount += cleanedCount;
      this.updateStats();
      
      logger.info('Expired cache entries cleaned', 'locationCacheManager', { cleanedCount });
    }
  }
}

// Export singleton instance
export const locationCacheManager = new LocationCacheManager();

// Export utility functions for common cache patterns
export const cacheUtils = {
  /**
   * Generate cache key for location data
   */
  locationKey(locationId: string): string {
    return `location:${locationId}`;
  },

  /**
   * Generate cache key for location list
   */
  locationListKey(params?: any): string {
    const paramString = params ? JSON.stringify(params) : 'all';
    return `locations:${paramString}`;
  },

  /**
   * Generate cache key for location with time slots
   */
  locationTimeSlotsKey(locationId: string, date: string): string {
    return `location:${locationId}:timeslots:${date}`;
  },

  /**
   * Generate cache key for location status
   */
  locationStatusKey(locationId: string): string {
    return `location:${locationId}:status`;
  }
};

export default locationCacheManager;