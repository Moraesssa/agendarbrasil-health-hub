# Supabase Helper Guide

## Overview

The `supabase-helper.js` utility provides centralized Supabase client creation to reduce code duplication and standardize database connections across the application.

## Usage

### Basic Usage

```javascript
const { createAnonClient, createServiceClient } = require('../src/lib/supabase-helper');

// For public operations (user authentication, public data)
const supabase = createAnonClient();

// For admin operations (user management, system operations)
const supabaseAdmin = createServiceClient();
```

### Available Functions

#### `createAnonClient()`
Creates a Supabase client with anonymous/public key for standard user operations.

```javascript
const supabase = createAnonClient();
const { data, error } = await supabase.from('profiles').select('*');
```

#### `createServiceClient()`
Creates a Supabase client with service role key for administrative operations.

```javascript
const supabaseAdmin = createServiceClient();
const { data, error } = await supabaseAdmin.auth.admin.listUsers();
```

#### `createCustomClient(url, key, options)`
Creates a Supabase client with custom configuration.

```javascript
const customClient = createCustomClient(
  'https://custom.supabase.co',
  'custom-key',
  { auth: { persistSession: false } }
);
```

#### `getSupabaseConfig()`
Returns the current Supabase configuration.

```javascript
const config = getSupabaseConfig();
console.log(config.url, config.anonKey, config.serviceKey);
```

## Environment Variables

The helper automatically detects and uses the following environment variables:

- `VITE_SUPABASE_URL` or `SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Migration Guide

### Before (Duplicated Code)
```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);
```

### After (Using Helper)
```javascript
const { createAnonClient } = require('../src/lib/supabase-helper');
const supabase = createAnonClient();
```

## Benefits

1. **Reduced Duplication**: Eliminates repeated client creation code
2. **Centralized Configuration**: Single source of truth for Supabase settings
3. **Environment Flexibility**: Automatic detection of different env variable formats
4. **Type Safety**: Consistent client configuration across the application
5. **Error Handling**: Built-in validation for required environment variables

## Best Practices

1. Use `createAnonClient()` for user-facing operations
2. Use `createServiceClient()` for admin/system operations
3. Always handle errors when creating clients
4. Use environment variables for sensitive keys
5. Import only the functions you need to reduce bundle size