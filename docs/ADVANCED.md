# Advanced Usage

This document covers advanced features and configuration options for the Pincho JavaScript/TypeScript client library.

## Table of Contents

- [Rate Limit Monitoring](#rate-limit-monitoring)
- [Retry-After Behavior](#retry-after-behavior)
- [Custom Configuration Options](#custom-configuration-options)
- [TypeScript Type Exports](#typescript-type-exports)
- [Error Handling and Error Codes](#error-handling-and-error-codes)
- [Encryption Details](#encryption-details)
- [NotifAI (AI-Powered Notifications)](#notifai-ai-powered-notifications)

## Rate Limit Monitoring

The client automatically tracks rate limit information from API response headers. You can access this information to proactively manage your request patterns.

### Accessing Rate Limit Information

```typescript
import { Pincho, type RateLimitInfo } from 'pincho';

const client = new Pincho();

// Send a notification
await client.send('Deploy', 'Version 1.2.3 deployed');

// Get rate limit info after request
const info: RateLimitInfo | null = client.getRateLimitInfo();

if (info) {
  console.log(`Limit: ${info.limit}`);           // Max requests in window
  console.log(`Remaining: ${info.remaining}`);   // Requests left
  console.log(`Resets at: ${info.reset}`);       // Date object

  // Calculate time until reset
  const timeUntilReset = info.reset.getTime() - Date.now();
  console.log(`Resets in ${Math.ceil(timeUntilReset / 1000)} seconds`);
}
```

### Proactive Rate Limit Checking

```typescript
async function sendWithRateLimitCheck(client: Pincho, title: string, message: string) {
  const info = client.getRateLimitInfo();

  if (info && info.remaining === 0) {
    const waitTime = info.reset.getTime() - Date.now();
    console.log(`Rate limited. Waiting ${waitTime}ms until reset...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  return client.send(title, message);
}
```

### Rate Limit Headers

The API provides standard rate limit headers:

- `RateLimit-Limit`: Maximum requests allowed in the current window
- `RateLimit-Remaining`: Requests remaining in the current window
- `RateLimit-Reset`: Unix timestamp when the window resets

## Retry-After Behavior

When rate limited (HTTP 429), the API may return a `Retry-After` header indicating how long to wait before retrying.

### Automatic Handling

The client automatically respects `Retry-After` headers:

```typescript
const client = new Pincho({
  maxRetries: 3  // Will retry up to 3 times
});

// If rate limited, the client will:
// 1. Parse the Retry-After header (if present)
// 2. Wait for the specified duration
// 3. Retry the request automatically
await client.send('Title', 'Message');
```

### Backoff Strategy

- **With Retry-After header**: Waits exactly the specified duration
- **Without Retry-After header**: Uses exponential backoff starting at 5 seconds
- **Maximum backoff**: 30 seconds
- **Other errors**: Start at 1 second, double each retry (1s, 2s, 4s, etc.)

### Accessing Retry-After in Errors

```typescript
import { PinchoError, ErrorCode } from 'pincho';

try {
  await client.send('Title', 'Message');
} catch (error) {
  if (error instanceof PinchoError && error.code === ErrorCode.RATE_LIMIT) {
    if (error.retryAfterSeconds !== undefined) {
      console.log(`Rate limited. Retry after ${error.retryAfterSeconds} seconds`);
    }
  }
}
```

## Custom Configuration Options

### Environment Variables

```bash
# Required (if not provided in constructor)
export PINCHO_TOKEN=your_api_token

# Optional
export PINCHO_TIMEOUT=60        # Timeout in seconds (default: 30)
export PINCHO_MAX_RETRIES=5     # Retry attempts (default: 3)
```

### Constructor Options

```typescript
import { Pincho, type ClientConfig } from 'pincho';

const config: ClientConfig = {
  // API token (required if PINCHO_TOKEN not set)
  token: 'your_token',

  // Request timeout in milliseconds (default: 30000)
  timeout: 60000,

  // Maximum retry attempts (default: 3, set to 0 to disable)
  maxRetries: 5,

  // Custom base URL (for testing or self-hosted)
  baseUrl: 'https://custom.api.server'
};

const client = new Pincho(config);
```

### Disabling Retries

```typescript
const client = new Pincho({
  maxRetries: 0  // No automatic retries
});
```

### Custom Timeout

```typescript
// 2 minute timeout for slow networks
const client = new Pincho({
  timeout: 120000  // milliseconds
});
```

## TypeScript Type Exports

The library exports comprehensive TypeScript types for full type safety:

### Available Types

```typescript
import {
  // Main client
  Pincho,

  // Error classes
  PinchoError,
  PinchoAuthError,
  PinchoValidationError,

  // Error codes enum
  ErrorCode,

  // Type definitions
  type ClientConfig,
  type NotificationOptions,
  type NotificationResponse,
  type NotifAIResponse,
  type RateLimitInfo,

  // Utility functions
  normalizeTags
} from 'pincho';
```

### Type Definitions

**ClientConfig**
```typescript
interface ClientConfig {
  token?: string;      // API token
  timeout?: number;    // Request timeout (ms)
  maxRetries?: number; // Retry attempts
  baseUrl?: string;    // Custom API URL
}
```

**NotificationOptions**
```typescript
interface NotificationOptions {
  title: string;                  // Required (max 250 chars)
  message: string;                // Required (max 10,000 chars)
  type?: string;                  // Optional (max 50 chars)
  tags?: string[];                // Optional (max 10 tags)
  imageURL?: string;              // Optional (max 2,000 chars)
  actionURL?: string;             // Optional (max 2,000 chars)
  encryptionPassword?: string;    // Optional encryption password
}
```

**NotificationResponse**
```typescript
interface NotificationResponse {
  status: string;   // 'success' or 'error'
  message: string;  // Human-readable message
}
```

**RateLimitInfo**
```typescript
interface RateLimitInfo {
  limit: number;      // Max requests in window
  remaining: number;  // Requests left
  reset: Date;        // When window resets
}
```

### Error Codes

```typescript
enum ErrorCode {
  UNKNOWN = 'UNKNOWN',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR'
}
```

## Error Handling and Error Codes

### Error Hierarchy

```typescript
Error
└── PinchoError (base)
    ├── PinchoAuthError (401, 403)
    └── PinchoValidationError (400, 404)
```

### Error Properties

```typescript
interface PinchoError extends Error {
  code: ErrorCode;            // Machine-readable error code
  isRetryable: boolean;       // Whether error can be retried
  retryAfterSeconds?: number; // Retry-After value (for 429)
}
```

### Comprehensive Error Handling

```typescript
import {
  Pincho,
  PinchoError,
  PinchoAuthError,
  PinchoValidationError,
  ErrorCode
} from 'pincho';

try {
  await client.send('Title', 'Message');
} catch (error) {
  if (error instanceof PinchoAuthError) {
    // Handle auth errors (401, 403)
    if (error.code === ErrorCode.AUTH_INVALID) {
      console.error('Invalid token - check credentials');
    } else if (error.code === ErrorCode.AUTH_FORBIDDEN) {
      console.error('Account disabled or insufficient permissions');
    }
  } else if (error instanceof PinchoValidationError) {
    // Handle validation errors (400, 404)
    if (error.code === ErrorCode.NOT_FOUND) {
      console.error('Resource not found');
    } else {
      console.error('Invalid parameters:', error.message);
    }
  } else if (error instanceof PinchoError) {
    // Handle other API errors
    switch (error.code) {
      case ErrorCode.NETWORK_ERROR:
        console.error('Network connectivity issue');
        break;
      case ErrorCode.TIMEOUT:
        console.error('Request timed out');
        break;
      case ErrorCode.RATE_LIMIT:
        console.error('Rate limited:', error.retryAfterSeconds);
        break;
      case ErrorCode.SERVER_ERROR:
        console.error('Server error (5xx)');
        break;
      default:
        console.error('Unknown error:', error.message);
    }
  }
}
```

## Encryption Details

### How Encryption Works

1. **Algorithm**: AES-128-CBC (matches mobile app)
2. **Key Derivation**: SHA-1 hash of password (for app compatibility)
3. **IV**: Random 16-byte initialization vector per message
4. **Encoding**: Custom Base64 (URL-safe: `-` `_` `.` instead of `+` `/` `=`)

### What Gets Encrypted

- **Encrypted**: Title, message, imageURL, actionURL
- **Not Encrypted**: Type, tags (needed for filtering/routing)

### Configuration in Mobile App

Before using encryption:
1. Open Pincho app
2. Go to notification type settings
3. Enable encryption for that type
4. Set the same password as in your code

### Example

```typescript
await client.send({
  title: 'Security Alert',           // Visible (for filtering)
  message: 'Sensitive information',  // Encrypted
  type: 'secure',                    // Must match app config
  encryptionPassword: process.env.ENCRYPTION_PASSWORD
});
```

## NotifAI (AI-Powered Notifications)

Convert free-form text into structured notifications using AI:

```typescript
const response = await client.notifai('deployment finished, v2.1.3 is live');

console.log(response.notification);
// {
//   title: 'Deployment Complete',
//   message: 'Version 2.1.3 has been successfully deployed',
//   type: 'deployment',
//   tags: ['release', 'v2.1.3'],
//   actionURL: null
// }
```

### With Type Override

```typescript
const response = await client.notifai('server CPU at 95%', 'alert');
// Forces type to 'alert' regardless of AI suggestion
```

### Input Constraints

- Minimum: 5 characters
- Maximum: 2500 characters

## JavaScript-Specific Features

### ES Modules Support

```javascript
// ESM (Node.js 18+)
import { Pincho } from 'pincho';
```

### CommonJS Support

```javascript
// CommonJS
const { Pincho } = require('pincho');
```

### Zero Runtime Dependencies

The library uses only Node.js built-in modules:
- `fetch` API (Node.js 18+ native)
- `crypto` module (for encryption)

No external HTTP clients (like axios) required.

### Browser Compatibility

While primarily designed for Node.js, the client uses standard `fetch` API and could work in browsers with appropriate bundling (note: `crypto` module usage would need polyfills for browser environments).

## Performance Tips

1. **Reuse Client Instances**: Create one client per token and reuse it
2. **Monitor Rate Limits**: Check `getRateLimitInfo()` to avoid hitting limits
3. **Batch Wisely**: Use `Promise.allSettled()` for concurrent sends with error recovery
4. **Set Appropriate Timeouts**: Increase timeout for unreliable networks
5. **Adjust Retry Strategy**: Set `maxRetries` based on your use case
