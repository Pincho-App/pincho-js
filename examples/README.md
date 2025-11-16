# WirePusher Examples

Practical examples for the WirePusher JavaScript/TypeScript library.

## Setup

```bash
npm install wirepusher
export WIREPUSHER_TOKEN=your_token
```

## Examples

### Basic Usage

- **`basic-commonjs.js`** - CommonJS (require)
- **`basic-esm.mjs`** - ES Modules (import)
- **`typescript-example.ts`** - TypeScript with error handling

```bash
node examples/basic-commonjs.js
node examples/basic-esm.mjs
npx ts-node examples/typescript-example.ts
```

### Framework Integration

- **`express-app.ts`** - Express.js server with notification endpoints
- **`nextjs-api-route.ts`** - Next.js App Router API route
- **`encryption.ts`** - AES-128-CBC encrypted messages

### Express Server

```bash
npx ts-node examples/express-app.ts
```

Endpoints:
- `POST /notify` - Send notification
- `POST /deploy/notify` - Deployment notification
- `POST /alert` - Monitoring alert

### Encryption

Setup in the app first:
1. Create notification type with encryption password
2. Use matching type and password when sending

```typescript
await client.send({
  title: 'Secure Alert',
  message: 'Sensitive data',
  type: 'security',
  encryptionPassword: process.env.WIREPUSHER_ENCRYPTION_PASSWORD
});
```

## Common Patterns

### Singleton Client

```typescript
// lib/wirepusher.ts
import { WirePusher } from 'wirepusher';
export const client = new WirePusher(); // reads WIREPUSHER_TOKEN
```

### Error Handling

```typescript
import { WirePusherAuthError, WirePusherValidationError } from 'wirepusher';

try {
  await client.send('Title', 'Message');
} catch (error) {
  if (error instanceof WirePusherAuthError) {
    // Invalid token
  } else if (error instanceof WirePusherValidationError) {
    // Invalid parameters
  }
  // Automatic retry handles transient errors
}
```

## Requirements

- Node.js 18+ (native fetch)
- TypeScript examples need: `npm install -D typescript ts-node @types/node`
