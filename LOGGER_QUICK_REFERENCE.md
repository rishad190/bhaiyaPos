# 📝 Logger Quick Reference

## 🚀 Quick Start

```javascript
import logger from '@/utils/logger';

// Use throughout your code
logger.error('Something failed', 'MyComponent');
logger.warn('Something suspicious', 'MyComponent');
logger.info('Something happened', 'MyComponent');
logger.debug('Debugging info', 'MyComponent');
```

---

## 📊 Log Levels

| Level | Dev | Prod | Use For |
|-------|-----|------|---------|
| **ERROR** | ✅ Shows | ✅ Shows + Tracked | Critical failures |
| **WARN** | ✅ Shows | ✅ Shows | Warnings, slow operations |
| **INFO** | ✅ Shows | ❌ Silent | General information |
| **DEBUG** | ✅ Shows | ❌ Silent | Debugging details |

---

## 💡 Common Patterns

### Basic Logging
```javascript
// Error
logger.error('Failed to save customer', 'CustomerService');

// Warning
logger.warn('Slow network detected', 'Network');

// Info
logger.info('Customer saved successfully', 'CustomerService');

// Debug
logger.debug('Cache hit for customer list', 'Cache');
```

### With Try-Catch
```javascript
try {
  await saveCustomer(data);
  logger.info('Customer saved', 'CustomerService');
} catch (error) {
  logger.error(`Failed to save customer: ${error.message}`, 'CustomerService');
  throw error;
}
```

### Performance Tracking
```javascript
import { trackPerformance } from '@/utils/logger';

const startTime = Date.now();
await fetchCustomers();
trackPerformance('fetchCustomers', startTime);
// Logs: "Operation completed: fetchCustomers took 150ms"
```

### Firebase Operations
```javascript
import { logFirebaseOp } from '@/utils/logger';

const startTime = Date.now();
try {
  const result = await get(ref(db, 'customers'));
  logFirebaseOp('getCustomers', true, Date.now() - startTime);
  return result;
} catch (error) {
  logFirebaseOp('getCustomers', false, Date.now() - startTime, { 
    error: error.message 
  });
  throw error;
}
```

---

## 🏷️ Recommended Contexts

Use consistent context names:

```javascript
'Firebase'           // Firebase operations
'Database'           // Database operations
'Auth'               // Authentication
'Cache'              // Caching
'QueryCache'         // React Query cache
'Network'            // Network requests
'Performance'        // Performance tracking
'CustomerService'    // Customer operations
'TransactionService' // Transaction operations
'Export'             // Export operations
'Backup'             // Backup/restore
'Migration'          // Database migrations
```

---

## ❌ Don't Do This

```javascript
// BAD - Shows in production
console.log('User data:', userData);

// BAD - No context
logger.error('Failed');

// BAD - Not descriptive
logger.error('Error', 'App');
```

---

## ✅ Do This

```javascript
// GOOD - Environment-aware
logger.debug('User data loaded', 'UserService');

// GOOD - Has context
logger.error('Failed to save customer', 'CustomerService');

// GOOD - Descriptive
logger.error(`Failed to save customer: ${error.message}`, 'CustomerService');
```

---

## 🎯 Output Format

```json
{
  "timestamp": "2024-11-19T10:30:00.000Z",
  "level": "ERROR",
  "context": "CustomerService",
  "message": "Failed to save customer: Network error",
  "environment": "production"
}
```

---

## 🔍 Finding Logs

### Browser Console
```
Development: All logs visible
Production: Only WARN and ERROR
```

### Filter by Context
```javascript
// In browser console
// Filter for specific context
// Look for: "context":"CustomerService"
```

### Filter by Level
```javascript
// In browser console
// Filter for errors only
// Look for: "level":"ERROR"
```

---

## 📦 Import Options

### Default Import
```javascript
import logger from '@/utils/logger';
logger.error('message', 'context');
```

### Named Imports
```javascript
import { logError, logWarn, logInfo, logDebug } from '@/utils/logger';
logError('message', 'context');
```

### Performance Tracking
```javascript
import { trackPerformance } from '@/utils/logger';
trackPerformance('operationName', startTime);
```

### Firebase Operations
```javascript
import { logFirebaseOp } from '@/utils/logger';
logFirebaseOp('operation', success, duration, additionalData);
```

---

## 🎉 That's It!

Replace all `console.log` with `logger.*` and enjoy:
- ✅ Environment-aware logging
- ✅ Structured logs
- ✅ Automatic error tracking
- ✅ Performance monitoring
- ✅ Production-ready

**Happy logging! 🚀**
