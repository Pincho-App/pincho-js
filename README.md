# WirePusher JavaScript Library

Official JavaScript/TypeScript client for [WirePusher](https://wirepusher.dev) push notifications.

## Installation

```bash
npm install wirepusher
```

## Quick Start

```typescript
import { WirePusher } from 'wirepusher';

// Auto-load token from WIREPUSHER_TOKEN env var
const client = new WirePusher();
await client.send('Deploy Complete', 'Version 1.2.3 deployed');

// Or provide token explicitly
const client = new WirePusher({ token: 'YOUR_TOKEN' });
await client.send('Alert', 'Server CPU at 95%');
```

## Features

```typescript
// Full parameters
await client.send({
  title: 'Deploy Complete',
  message: 'Version 1.2.3 deployed',
  type: 'deployment',
  tags: ['production', 'backend'],
  imageURL: 'https://example.com/success.png',
  actionURL: 'https://example.com/deploy/123'
});

// AI-powered notifications (NotifAI)
const response = await client.notifai('deployment finished, v2.1.3 is live');
console.log(response.notification); // AI-generated title, message, tags

// Encrypted messages
await client.send({
  title: 'Security Alert',
  message: 'Sensitive data',
  type: 'security',
  encryptionPassword: 'your_password'
});

// CommonJS
const { WirePusher } = require('wirepusher');
```

## Configuration

```typescript
// Environment variables (recommended)
// WIREPUSHER_TOKEN - API token (required if not passed to constructor)
// WIREPUSHER_TIMEOUT - Request timeout in seconds (default: 30)
// WIREPUSHER_MAX_RETRIES - Retry attempts (default: 3)

// Or explicit configuration
const client = new WirePusher({
  token: 'abc12345',
  timeout: 60000,  // milliseconds
  maxRetries: 5
});
```

## Error Handling

```typescript
import {
  WirePusher,
  WirePusherAuthError,
  WirePusherValidationError
} from 'wirepusher';

try {
  await client.send('Title', 'Message');
} catch (error) {
  if (error instanceof WirePusherAuthError) {
    console.error('Invalid token');
  } else if (error instanceof WirePusherValidationError) {
    console.error('Invalid parameters');
  }
}
```

Automatic retry with exponential backoff for network errors, 5xx, and 429 (rate limit).

## Smart Rate Limiting

The client automatically handles rate limits and provides access to rate limit information:

```typescript
await client.send('Alert', 'Message');
const info = client.getRateLimitInfo();
console.log(`${info.remaining}/${info.limit} requests left, resets at ${info.reset}`);
```

Rate limit errors (429) are retried automatically with Retry-After header support for optimal backoff timing.

## Requirements

- Node.js 18+ (native fetch)
- Zero runtime dependencies
- Full TypeScript support

## Links

- **Get Token**: App → Settings → Help → copy token
- **Documentation**: https://wirepusher.dev/help
- **Repository**: https://gitlab.com/wirepusher/wirepusher-js
- **npm**: https://www.npmjs.com/package/wirepusher

## License

MIT
