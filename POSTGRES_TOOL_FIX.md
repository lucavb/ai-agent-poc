# PostgreSQL Tool Fix Summary

## Problem
After the recent commit "feat: allow for more than one database to be included" (81b8960), the postgres schema and query tools started failing with:
```
Error: AI SDK error: Error executing tool postgres_schema: Tool execution error for "postgres_schema": Database connection error
```

## Root Causes Identified

1. **Missing Legacy Variable Fallback in config.ts**
   - The `getCoreServiceConfig()` function was not properly falling back to legacy `POSTGRES_*` environment variables
   - It was falling back to hardcoded defaults instead of checking `envVars.POSTGRES_HOST`, etc.

2. **Required database_source Parameter**
   - Both `postgres_schema` and `postgres_query` tools now required a new `database_source` parameter
   - This broke backward compatibility with existing API/FE calls that didn't provide this parameter

3. **Health Controller Using Deprecated Function**
   - The HealthController was still using the removed `getPostgresConfig()` function

## Changes Made

### 1. Fixed config.ts (lines 218-244)
**getCoreServiceConfig():**
```typescript
// Before: Only checked new naming, fell back to hardcoded defaults
const host = envVars.POSTGRES_CORE_SERVICE_HOST ?? 'localhost';

// After: Checks new naming, then legacy, then hardcoded defaults
const host = envVars.POSTGRES_CORE_SERVICE_HOST ?? envVars.POSTGRES_HOST ?? 'localhost';
```

**getExternalPartnerServiceConfig():**
```typescript
// Before: Only checked new naming, fell back to hardcoded defaults
const host = envVars.POSTGRES_EXTERNAL_PARTNER_SERVICE_HOST ?? 'localhost';

// After: Checks new naming, then legacy POSTGRES2_*, then core service defaults
const coreConfig = getCoreServiceConfig();
const host = envVars.POSTGRES_EXTERNAL_PARTNER_SERVICE_HOST ?? envVars.POSTGRES2_HOST ?? coreConfig.host;
```

### 2. Made database_source Optional in postgres-tool.ts (line 20)
```typescript
// Before: Required parameter
database_source: z.enum(enumValues).describe(...)

// After: Optional with default value
database_source: z.enum(enumValues).optional().default('core-service').describe(...)
```

### 3. Made database_source Optional in postgres-query-tool.ts (line 32)
```typescript
// Before: Required parameter
database_source: z.enum(enumValues).describe(...)

// After: Optional with default value
database_source: z.enum(enumValues).optional().default('core-service').describe(...)
```

### 4. Updated HealthController.ts (lines 4, 27)
```typescript
// Before: Used removed function
import { getPostgresConfig } from '../../config';
const pgConfig = getPostgresConfig();

// After: Uses new function with database source
import { getDatabaseConfig } from '../../config';
const pgConfig = getDatabaseConfig('core-service');
```

## Environment Variable Support

The fixed code now supports multiple naming conventions for backward compatibility:

### Core Service Database (Primary)
1. **New naming (recommended):**
   - `POSTGRES_CORE_SERVICE_HOST`
   - `POSTGRES_CORE_SERVICE_PORT`
   - `POSTGRES_CORE_SERVICE_DB`
   - `POSTGRES_CORE_SERVICE_USER`
   - `POSTGRES_CORE_SERVICE_PASSWORD`
   - `POSTGRES_CORE_SERVICE_SSL`
   - `POSTGRES_CORE_SERVICE_MAX_RETRIES`

2. **Legacy naming (backward compatible):**
   - `POSTGRES_HOST`
   - `POSTGRES_PORT`
   - `POSTGRES_DB`
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_SSL`
   - `POSTGRES_MAX_RETRIES`

### External Partner Service Database (Secondary)
1. **New naming (recommended):**
   - `POSTGRES_EXTERNAL_PARTNER_SERVICE_HOST`
   - `POSTGRES_EXTERNAL_PARTNER_SERVICE_PORT`
   - `POSTGRES_EXTERNAL_PARTNER_SERVICE_DB`
   - etc.

2. **Legacy naming (backward compatible):**
   - `POSTGRES2_HOST`
   - `POSTGRES2_PORT`
   - `POSTGRES2_DB`
   - etc.

## Impact on API/Frontend

### No Changes Required!
The fixes ensure backward compatibility:
- API calls without `database_source` parameter now work automatically
- The tools default to `'core-service'` database
- Existing code doesn't need to be updated
- Frontend code continues to work as before

### Optional Enhancement
If you want to explicitly specify which database to query, you can now pass:
```typescript
// Query core service database (default)
{ query: "SELECT * FROM users" }

// Query core service database (explicit)
{ query: "SELECT * FROM users", database_source: "core-service" }

// Query external partner service database
{ query: "SELECT * FROM orders", database_source: "external-partner-service" }

// Cross-database query
{ 
  query: "SELECT * FROM core-service:users JOIN external-partner-service:orders ON ...",
  database_source: "both"
}
```

## Testing

The backend has been rebuilt successfully with no errors or linting issues.

### To Test:
1. Restart the backend server
2. Try calling the postgres_schema tool from the frontend
3. The error should now be resolved

## Next Steps

1. **Restart the backend server** to apply the changes
2. **Test the frontend** by trying to query the database schema
3. **Monitor logs** to ensure the database connection is working correctly

If you're using Docker, restart the backend container:
```bash
docker-compose restart backend
# or
npm run dev  # if running locally
```

