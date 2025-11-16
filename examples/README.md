# WirePusher Examples

Comprehensive examples for the WirePusher JavaScript/TypeScript client library, demonstrating various use cases and integration patterns.

## Setup

```bash
# Install the library
npm install wirepusher

# Set your API token
export WIREPUSHER_TOKEN=your_token_here

# For TypeScript examples
npm install -D typescript ts-node @types/node

# For Express example
npm install express @types/express
```

## Examples Overview

| Example | File | Purpose |
|---------|------|---------|
| **Basic CommonJS** | `basic-commonjs.js` | Simple usage with CommonJS modules |
| **Basic ESM** | `basic-esm.mjs` | ES Modules syntax |
| **TypeScript** | `typescript-example.ts` | Type-safe usage with error handling |
| **Express Server** | `express-app.ts` | REST API with notification endpoints |
| **Next.js API** | `nextjs-api-route.ts` | Next.js App Router integration |
| **Encryption** | `encryption.ts` | End-to-end encrypted messages |
| **Rate Limits** | `rate-limits.ts` | Monitor and manage rate limiting |

## Running Examples

### Basic JavaScript Examples

```bash
# CommonJS (traditional Node.js)
node examples/basic-commonjs.js

# ES Modules
node examples/basic-esm.mjs
```

**Demonstrates:**
- Client initialization
- Simple notification sending
- Advanced notifications with all options
- Basic error handling

### TypeScript Example

```bash
npx ts-node examples/typescript-example.ts
```

**Demonstrates:**
- Full type safety with TypeScript
- Importing type definitions
- Comprehensive error handling by error type
- Batch notification sending with Promise.allSettled()
- Notification factory patterns

### Express.js Server

```bash
npx ts-node examples/express-app.ts
```

**Starts server on port 3000 with endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/notify` | Send simple notification |
| `POST` | `/notify/advanced` | Send with all parameters |
| `POST` | `/deploy/notify` | Deployment notifications |
| `POST` | `/ci/build` | CI/CD build notifications |
| `POST` | `/alert` | Monitoring alerts |

**Example request:**
```bash
curl -X POST http://localhost:3000/notify \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "message": "Hello from Express!"}'
```

**Demonstrates:**
- Singleton client pattern
- Express middleware integration
- Error handling middleware
- Multiple notification use cases
- Server-side notification patterns

### Next.js API Route

The `nextjs-api-route.ts` file contains examples for:

1. **App Router API Route** - `POST /api/notify`
2. **Pages Router Handler** (commented)
3. **Server Actions** (commented)
4. **Client Component Form** (commented)

**Demonstrates:**
- Next.js 13+ App Router integration
- Server-side notification sending
- Error mapping to HTTP status codes
- TypeScript with Next.js types

### Encryption Example

```bash
# Set encryption password (must match app configuration)
export WIREPUSHER_ENCRYPTION_PASSWORD=your_strong_password

npx ts-node examples/encryption.ts
```

**Demonstrates:**
- Sending encrypted notifications
- Environment variable best practices
- What gets encrypted vs. stays visible
- Security considerations

### Rate Limits Example

```bash
npx ts-node examples/rate-limits.ts
```

**Demonstrates:**
- Accessing rate limit information
- Proactive rate limit checking
- Monitoring remaining requests
- Calculating time until reset
- Batch sending with rate limit awareness

## Common Integration Patterns

### Singleton Client

```typescript
// lib/wirepusher.ts
import { WirePusher } from 'wirepusher';

export const notificationClient = new WirePusher();
// Reuse across your application
```

### Environment-Based Configuration

```typescript
const client = new WirePusher({
  token: process.env.WIREPUSHER_TOKEN,
  timeout: parseInt(process.env.WIREPUSHER_TIMEOUT || '30') * 1000,
  maxRetries: parseInt(process.env.WIREPUSHER_MAX_RETRIES || '3')
});
```

### Comprehensive Error Handling

```typescript
import {
  WirePusherAuthError,
  WirePusherValidationError,
  WirePusherError,
  ErrorCode
} from 'wirepusher';

try {
  await client.send('Title', 'Message');
} catch (error) {
  if (error instanceof WirePusherAuthError) {
    // Invalid token or forbidden (401/403)
    console.error('Authentication failed');
  } else if (error instanceof WirePusherValidationError) {
    // Bad request or not found (400/404)
    console.error('Invalid parameters');
  } else if (error instanceof WirePusherError) {
    // Other API errors
    if (error.code === ErrorCode.RATE_LIMIT) {
      console.error('Rate limited');
    } else if (error.code === ErrorCode.TIMEOUT) {
      console.error('Request timed out');
    }
  }
  // Automatic retry handles transient errors
}
```

### Rate Limit Aware Sending

```typescript
const info = client.getRateLimitInfo();
if (info && info.remaining < 10) {
  console.warn(`Only ${info.remaining} requests remaining`);
}
await client.send('Title', 'Message');
```

### Webhook Handler Pattern

```typescript
app.post('/webhook/github', async (req, res) => {
  const { action, repository } = req.body;

  await client.send({
    title: `GitHub: ${action}`,
    message: `Repository: ${repository.full_name}`,
    type: 'github',
    tags: ['webhook', action],
    actionURL: repository.html_url
  });

  res.json({ received: true });
});
```

## Testing Examples

These examples use fallback tokens (`abc12345`) when `WIREPUSHER_TOKEN` is not set. For actual use:

1. Get your token from the WirePusher app (Settings > Help > copy token)
2. Set the environment variable:
   ```bash
   export WIREPUSHER_TOKEN=your_actual_token
   ```
3. Run the example

## Requirements

- **Node.js 18+** (native fetch API)
- **TypeScript 5.x** (for TS examples)
- No runtime dependencies in production

## Advanced Documentation

For more advanced topics like:
- Rate limit monitoring details
- Retry-After behavior
- TypeScript type exports
- Encryption internals
- Custom configuration

See [docs/ADVANCED.md](../docs/ADVANCED.md).
