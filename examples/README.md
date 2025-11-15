# WirePusher Client Library Examples

This directory contains practical examples demonstrating how to use the WirePusher JavaScript Client Library in different environments.

## Prerequisites

Before running any examples, make sure you have:

1. Node.js >= 18.0.0 installed
2. A WirePusher account with:
   - API token
   - User ID

## Setup

### 1. Install the SDK

```bash
npm install wirepusher
```

### 2. Set Environment Variables

Create a `.env` file in your project root:

```bash
WIREPUSHER_TOKEN=abc12345
WIREPUSHER_USER_ID=your_user_id
```

For Node.js projects, install dotenv:

```bash
npm install dotenv
```

And load it at the start of your application:

```javascript
require('dotenv').config();
```

## Examples

### 1. Basic CommonJS Example

**File:** `basic-commonjs.js`

Traditional Node.js example using CommonJS modules.

**Run:**
```bash
node examples/basic-commonjs.js
```

**Use when:**
- Working with legacy Node.js projects
- Using CommonJS module system
- Not using ES modules

### 2. Basic ES Modules Example

**File:** `basic-esm.mjs`

Modern Node.js example using ES modules.

**Run:**
```bash
node examples/basic-esm.mjs
```

**Use when:**
- Working with modern Node.js projects (18+)
- Using ES modules (`"type": "module"` in package.json)
- Want cleaner import syntax

### 3. TypeScript Example

**File:** `typescript-example.ts`

Comprehensive TypeScript example with full type safety.

**Setup:**
```bash
npm install -D typescript @types/node
npx tsc --init
```

**Run:**
```bash
# Compile and run
npx ts-node examples/typescript-example.ts

# Or compile first
npx tsc examples/typescript-example.ts
node examples/typescript-example.js
```

**Use when:**
- Building TypeScript applications
- Want full type safety and IntelliSense
- Need comprehensive error handling examples

**Features shown:**
- Type-safe API usage
- Comprehensive error handling
- Batch notifications
- Notification factory pattern

### 4. Express.js Integration

**File:** `express-app.ts`

Full Express.js server with multiple notification endpoints.

**Setup:**
```bash
npm install express
npm install -D @types/express ts-node
```

**Run:**
```bash
npx ts-node examples/express-app.ts
```

**Endpoints:**
- `POST /notify` - Simple notification
- `POST /notify/advanced` - Advanced notification with all options
- `POST /deploy/notify` - Deployment notification
- `POST /ci/build` - CI/CD build notification
- `POST /alert` - Monitoring alert notification

**Example requests:**

```bash
# Simple notification
curl -X POST http://localhost:3000/notify \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "message": "Hello World"}'

# Deploy notification
curl -X POST http://localhost:3000/deploy/notify \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.2.3",
    "environment": "production",
    "status": "success"
  }'

# Alert notification
curl -X POST http://localhost:3000/alert \
  -H "Content-Type: application/json" \
  -d '{
    "service": "web-api",
    "severity": "critical",
    "metric": "error_rate",
    "value": "15%",
    "threshold": "5%"
  }'
```

**Use when:**
- Building REST APIs
- Need webhook handlers
- Integrating with CI/CD pipelines
- Building monitoring systems

### 5. Next.js API Route

**File:** `nextjs-api-route.ts`

Next.js integration examples for both App Router and Pages Router.

**Setup:**

For Next.js 13+ App Router, create:
```
app/api/notify/route.ts
```

For Pages Router, create:
```
pages/api/notify.ts
```

**Use when:**
- Building Next.js applications
- Need server-side notification sending
- Want to expose notification API to your frontend

**Features shown:**
- App Router API route
- Pages Router API route (commented)
- Server Actions (commented)
- Client component example (commented)

## Common Patterns

### Singleton Client

Reuse a single client instance across your application:

```typescript
// lib/notification-client.ts
import { WirePusher } from 'wirepusher';

export const notificationClient = new WirePusher({
  token: process.env.WIREPUSHER_TOKEN!,
  userId: process.env.WIREPUSHER_USER_ID!,
});

// other-file.ts
import { notificationClient } from './lib/notification-client';

await notificationClient.send('Title', 'Message');
```

### Error Handling

Always handle errors gracefully:

```typescript
try {
  await client.send('Title', 'Message');
} catch (error) {
  if (error instanceof WirePusherAuthError) {
    // Handle auth errors
  } else if (error instanceof WirePusherValidationError) {
    // Handle validation errors
  } else if (error instanceof WirePusherError) {
    // Handle other API errors
  }
  // Don't let notification failures break your app
}
```

### Environment-Specific Configuration

Different configs for different environments:

```typescript
const client = new WirePusher({
  token: process.env.WIREPUSHER_TOKEN!,
  userId: process.env.WIREPUSHER_USER_ID!,
  timeout: process.env.NODE_ENV === 'production' ? 60000 : 30000,
});
```

## Troubleshooting

### "Module not found: wirepusher"

Make sure you've installed the package:
```bash
npm install wirepusher
```

### "fetch is not defined"

Ensure you're using Node.js >= 18.0.0:
```bash
node --version
```

### Authentication errors

Check your environment variables:
```javascript
console.log('Token:', process.env.WIREPUSHER_TOKEN);
console.log('User ID:', process.env.WIREPUSHER_USER_ID);
```

### TypeScript errors

Make sure you have type definitions:
```bash
npm install -D @types/node
```

## Additional Resources

- [Main README](../README.md)
- [WirePusher Documentation](https://wirepusher.com/api)
- [API Reference](../README.md#api-reference)

## Questions or Issues?

- Open an issue: https://gitlab.com/wirepusher/wirepusher-js/-/issues
- Email: support@wirepusher.com
