// ============= Common Types for Normalized Schema =============

// Base entity interface for all normalized types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Common filters
export interface DateRangeFilter {
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationFilter {
  page?: number;
  limit?: number;
}

export interface SortFilter {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BaseFilters extends DateRangeFilter, PaginationFilter, SortFilter {
  search?: string;
}

// Schema version type for migration tracking
export type SchemaVersion = 'legacy' | 'v2' | 'hybrid';

// Dual-read result type
export interface DualReadResult<T> {
  data: T[];
  sources: {
    v2_count: number;
    legacy_count: number;
    total_count: number;
  };
  schema_version: SchemaVersion;
}

// Migration status
export interface MigrationStatus {
  table_name: string;
  legacy_records: number;
  v2_records: number;
  migration_progress: number; // 0-100
  estimated_completion?: string;
}

// Validation result types
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface TypeConversionResult<T> {
  converted: T;
  source_type: string;
  conversion_successful: boolean;
  warnings?: string[];
}

// Environment configuration
export interface EnvironmentConfig {
  schema_version: SchemaVersion;
  dual_read_enabled: boolean;
  migration_mode: boolean;
  debug_logging: boolean;
}

// Error types for better error handling
export interface TypedError {
  code: string;
  message: string;
  details?: Record<string, any>;
  source: 'validation' | 'conversion' | 'database' | 'api';
}

// Audit trail for schema changes
export interface AuditEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: 'create' | 'update' | 'delete' | 'migrate';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  schema_version: SchemaVersion;
  user_id?: string;
  timestamp: string;
}