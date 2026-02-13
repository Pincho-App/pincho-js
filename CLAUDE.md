# CLAUDE.md - Pincho JavaScript/TypeScript Client Library

Context file for AI-powered development assistance on the Pincho JavaScript/TypeScript client library project.

## Project Overview

**Pincho JavaScript Client Library** is a TypeScript/JavaScript client library for sending push notifications via [Pincho](https://pincho.app).

- **Language**: TypeScript (compiles to JavaScript ES2020+)
- **Runtime**: Node.js 18+ (native fetch API)
- **HTTP Client**: Native fetch API (zero runtime dependencies)
- **Purpose**: Send notifications from Node.js applications, scripts, and services
- **Philosophy**: Zero dependencies, TypeScript-first, dual package (ESM/CJS)

## Architecture

```
pincho-js/
├── src/                      # Source code (TypeScript)
│   ├── index.ts              # Public API exports
│   ├── client.ts             # Main Pincho client class
│   ├── types.ts              # TypeScript type definitions
│   ├── errors.ts             # Custom error classes
│   ├── crypto.ts             # AES-128-CBC encryption
│   └── utils.ts              # Utility functions
├── tests/                    # Test suite (Vitest)
│   ├── client.test.ts        # Client tests
│   ├── crypto.test.ts        # Encryption tests
│   ├── errors.test.ts        # Error handling tests
│   └── utils.test.ts         # Utility tests
├── examples/                 # Usage examples
├── dist/                     # Built package (generated)
│   ├── index.js              # ESM build
│   ├── index.cjs             # CommonJS build
│   ├── index.d.ts            # TypeScript definitions (ESM)
│   └── index.d.cts           # TypeScript definitions (CJS)
├── docs/                     # Documentation
├── package.json              # Package configuration
└── tsup.config.ts            # Build configuration
```

## Key Features

### 1. Zero Runtime Dependencies

**Native fetch API**:
- Uses Node.js 18+ native fetch (no axios/node-fetch needed)
- AbortController for timeout handling
- HTTP/2 support out of the box

**Crypto module**:
- Uses Node.js built-in `crypto` module for encryption
- AES-128-CBC encryption matching mobile app

### 2. Dual Package Support

**ESM (ES Modules)**:
```typescript
import { Pincho } from 'pincho';
```

**CommonJS**:
```javascript
const { Pincho } = require('pincho');
```

### 3. API Methods

**send()** - Send notifications:
```typescript
// Simple form
await client.send('Deploy Complete', 'v1.2.3 deployed');

// Full options
await client.send({
  title: 'Deploy Complete',
  message: 'v1.2.3 deployed',
  type: 'deployment',
  tags: ['production', 'release'],
  imageURL: 'https://example.com/image.png',
  actionURL: 'https://example.com/action',
  encryptionPassword: 'secret'
});
```

**notifai()** - AI-powered notifications:
```typescript
const response = await client.notifai('deployment finished, v2.1.3 is live');
console.log(response.notification); // AI-generated title, message, tags
```

### 4. Error Handling

Custom error classes:
- `PinchoError` (base class) - General API errors
- `PinchoAuthError` (401, 403) - Authentication failures
- `PinchoValidationError` (400, 404) - Invalid parameters

All errors have `isRetryable` property.

### 5. Automatic Retry Logic

- **Default**: 3 retries with exponential backoff
- **Backoff strategy**: 1s, 2s, 4s, 8s (capped at 30s)
- **Rate limit handling**: Uses Retry-After header if present
- **Retryable**: Network errors, 5xx, 429
- **Non-retryable**: 400, 401, 403, 404

## Configuration

```typescript
// Auto-load from environment variables
const client = new Pincho();  // reads PINCHO_TOKEN

// Explicit configuration
const client = new Pincho({
  token: 'abc12345',           // Or PINCHO_TOKEN env var
  timeout: 60000,              // Or PINCHO_TIMEOUT (seconds) env var
  maxRetries: 5,               // Or PINCHO_MAX_RETRIES env var
  baseUrl: '...'               // Custom base URL (for testing)
});
```

**Environment Variables**:
- `PINCHO_TOKEN` - API token (required if not passed to constructor)
- `PINCHO_TIMEOUT` - Request timeout in seconds (default: 30)
- `PINCHO_MAX_RETRIES` - Maximum retry attempts (default: 3)

## Dependencies

**Runtime** (ZERO):
- Native fetch API (Node.js 18+)
- Native crypto module (Node.js)

**Development**:
- `typescript` - TypeScript compiler
- `tsup` - Build tool (zero-config bundler)
- `vitest` - Testing framework
- `eslint` - Linting
- `prettier` - Code formatting

## Development

### Setup

```bash
npm install
```

### Testing

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
npm run typecheck           # Type checking
```

### Code Quality

```bash
npm run lint                # Check linting
npm run lint:fix            # Auto-fix linting issues
npm run format              # Auto-format code
npm run format:check        # Check formatting
```

### Building

```bash
npm run build               # Build package
```

## Testing Philosophy

- **Unit tests**: Test client methods in isolation
- **Mock fetch**: Use Vitest mocking for fetch API
- **Type safety**: Run TypeScript compiler (`typecheck`)
- **Coverage target**: >90% for statements, branches, functions, lines

## Notes for AI Assistants

- **Zero dependencies**: Keep runtime dependency-free (use native APIs)
- **TypeScript-first**: Always add proper types and JSDoc comments
- **Dual package**: Ensure ESM/CJS compatibility (test both)
- **Native fetch**: Use fetch API, not axios or other HTTP clients
- **Error handling**: Use custom error classes, not generic Error
- **Testing**: Write tests for all features (>90% coverage)
- **Documentation**: Update README for user-facing changes

## Links

- **Repository**: https://github.com/Pincho-App/pincho-js
- **Issues**: https://github.com/Pincho-App/pincho-js/issues
- **npm Package**: https://www.npmjs.com/package/pincho
- **API Docs**: https://pincho.app/help
- **App**: https://pincho.app
