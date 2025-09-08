# Authentication Utilities

## Overview

The `authUtils.ts` module provides centralized authentication utilities to avoid code duplication across services and components.

## Functions

### `checkAuthentication()`

Verifies if a user is authenticated and returns the user object.

**Returns:** `Promise<User>` - The authenticated user object
**Throws:** `Error` - If user is not authenticated

**Usage:**
```typescript
import { checkAuthentication } from '@/utils/authUtils';

const user = await checkAuthentication();
// User is guaranteed to be authenticated at this point
```

### `getCurrentUser()`

Gets the current user without throwing an error if not authenticated.

**Returns:** `Promise<User | null>` - The user object or null if not authenticated

**Usage:**
```typescript
import { getCurrentUser } from '@/utils/authUtils';

const user = await getCurrentUser();
if (user) {
  // User is authenticated
} else {
  // User is not authenticated
}
```

## Migration from Duplicate Code

This utility replaces duplicate authentication checks that were previously scattered across:
- `src/services/newAppointmentService.ts`
- `src/services/appointmentService.tsx`

The refactoring improves maintainability and ensures consistent error handling across the application.