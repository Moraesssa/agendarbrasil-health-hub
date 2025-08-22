// Sistema de cache inteligente para produção
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ProductionCache {
  private cache = new Map<string, CacheItem<any>>();
  
  // Cache especialidades (dados estáticos) - 1 hora
  private SPECIALTIES_TTL = 60 * 60 * 1000;
  
  // Cache médicos por localização - 30 minutos
  private DOCTORS_TTL = 30 * 60 * 1000;
  
  // Cache horários disponíveis - 5 minutos
  private SLOTS_TTL = 5 * 60 * 1000;

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.SPECIALTIES_TTL
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Verificar se expirou
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  // Cache especialidades (dados que raramente mudam)
  cacheSpecialties(specialties: string[]): void {
    this.set('specialties', specialties, this.SPECIALTIES_TTL);
  }

  getCachedSpecialties(): string[] | null {
    return this.get<string[]>('specialties');
  }

  // Cache médicos por localização e especialidade
  cacheDoctors(specialty: string, city: string, state: string, doctors: any[]): void {
    const key = `doctors_${specialty}_${city}_${state}`;
    this.set(key, doctors, this.DOCTORS_TTL);
  }

  getCachedDoctors(specialty: string, city: string, state: string): any[] | null {
    const key = `doctors_${specialty}_${city}_${state}`;
    return this.get<any[]>(key);
  }

  // Cache horários disponíveis
  cacheSlots(doctorId: string, date: string, slots: any[]): void {
    const key = `slots_${doctorId}_${date}`;
    this.set(key, slots, this.SLOTS_TTL);
  }

  getCachedSlots(doctorId: string, date: string): any[] | null {
    const key = `slots_${doctorId}_${date}`;
    return this.get<any[]>(key);
  }

  // Limpar cache expirado periodicamente
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Invalidar cache específico
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const productionCache = new ProductionCache();

// Limpar cache expirado a cada 10 minutos
setInterval(() => productionCache.cleanup(), 10 * 60 * 1000);