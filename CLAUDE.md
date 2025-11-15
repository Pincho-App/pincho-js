# CLAUDE.md - WirePusher JavaScript/TypeScript Client Library

Context file for AI-powered development assistance on the WirePusher JavaScript/TypeScript client library project.

## Project Overview

**WirePusher JavaScript Client Library** is a TypeScript/JavaScript client library for sending push notifications via [WirePusher](https://wirepusher.dev).

- **Language**: TypeScript (compiles to JavaScript ES2020+)
- **Runtime**: Node.js 18+ (native fetch API)
- **HTTP Client**: Native fetch API (zero runtime dependencies)
- **Purpose**: Send notifications from Node.js applications, scripts, and services
- **Philosophy**: Zero dependencies, TypeScript-first, dual package (ESM/CJS)

## Architecture

```
wirepusher-js/
├── src/                      # Source code (TypeScript)
│   ├── index.ts              # Public API exports
│   ├── client.ts             # Main WirePusher client class
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
- No external HTTP client dependencies

**Crypto module**:
- Uses Node.js built-in `crypto` module for encryption
- AES-128-CBC encryption matching mobile app

### 2. Dual Package Support

**ESM (ES Modules)**:
```typescript
import { WirePusher } from 'wirepusher';
```

**CommonJS**:
```javascript
const { WirePusher } = require('wirepusher');
```

Build process (tsup):
- `dist/index.js` - ES modules
- `dist/index.cjs` - CommonJS
- `dist/index.d.ts` - TypeScript definitions (ESM)
- `dist/index.d.cts` - TypeScript definitions (CJS)

### 3. TypeScript-First Design

**Full type safety**:
- All public APIs have comprehensive type definitions
- JSDoc comments on all types and methods
- Strict TypeScript compilation
- IDE autocomplete and IntelliSense support

**Type exports**:
- `ClientConfig` - Client initialization options
- `NotificationOptions` - Notification parameters
- `NotificationResponse` - API response structure

### 4. API Method

**send()** - Send notifications with method overloading:

**Simple form**:
```typescript
await client.send('Deploy Complete', 'v1.2.3 deployed');
```

**Full options**:
```typescript
await client.send({
  title: 'Deploy Complete',
  message: 'v1.2.3 deployed',
  type: 'deployment',
  tags: ['production', 'release'],
  imageURL: 'https://example.com/image.png',
  actionURL: 'https://example.com/action',
  encryptionPassword: 'secret'  // Optional
});
```

### 5. Error Handling

Custom error classes with proper inheritance:

- `WirePusherError` (base class) - General API errors
- `WirePusherAuthError` (401, 403) - Authentication failures
- `WirePusherValidationError` (400, 404) - Invalid parameters

All errors extend native `Error` class for proper stack traces.

### 6. Timeout Handling

**AbortController-based timeouts**:
- Default: 30 seconds
- Configurable via `timeout` parameter
- Proper cleanup on timeout
- Clear error messages

Implementation in `client.ts`:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), this.timeout);

try {
  const response = await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeoutId);
}
```

### 7. Encryption

**AES-128-CBC** encryption matching mobile app:
- SHA-1-based key derivation (for app compatibility)
- Custom Base64 encoding (URL-safe: `-` `_` `.` instead of `+` `/` `=`)
- Only message encrypted (title, type, tags remain visible)
- Password must match type configuration in app

Implementation: `crypto.ts`

## Configuration

Constructor-based configuration (no config files):

```typescript
// Required: token
const client = new WirePusher({ token: 'abc12345' });

// Optional parameters
const client = new WirePusher({
  token: 'abc12345',
  timeout: 60000,        // Request timeout in ms (default: 30000)
  baseUrl: '...'         // Custom base URL (for testing)
});
```

**Authentication**:
- `token` - Team token (preferred)
- `deviceId` - Legacy device ID (deprecated)

## Dependencies

**Runtime** (ZERO):
- Native fetch API (Node.js 18+)
- Native crypto module (Node.js)

**Development**:
- `typescript ^5.3.3` - TypeScript compiler
- `tsup ^8.0.1` - Build tool (zero-config bundler)
- `vitest ^1.0.4` - Testing framework (Vite-powered)
- `@vitest/coverage-v8 ^1.0.0` - Coverage reporting
- `eslint ^8.56.0` - Linting
- `@typescript-eslint/eslint-plugin ^6.15.0` - TypeScript ESLint rules
- `@typescript-eslint/parser ^6.15.0` - TypeScript parser for ESLint
- `prettier ^3.1.1` - Code formatting
- `@types/node ^20.10.0` - Node.js type definitions

## Build Process

**tsup configuration** (`tsup.config.ts`):
- Entry: `src/index.ts`
- Formats: ESM (`index.js`) and CJS (`index.cjs`)
- TypeScript declarations: `.d.ts` and `.d.cts`
- Target: ES2020
- Minification: No (for debugging)
- Source maps: Yes
- Clean dist on build

**Build command**:
```bash
npm run build
```

## Testing

**Vitest** test framework:
- Fast, Vite-powered testing
- ESM-first (matches package architecture)
- Built-in TypeScript support
- Coverage with V8

**Test structure**:
```typescript
describe('WirePusher', () => {
  describe('send', () => {
    it('should send notification with title and message', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

**Coverage targets**: >90% for all metrics

## Recent Changes

### v1.0.0 (Current)

**Added**:
- Initial release with TypeScript support
- Zero-dependency implementation using native fetch
- Dual package support (ESM/CJS)
- Custom error classes for better error handling
- Method overloading for flexible API
- Configurable timeouts using AbortController
- AES-128-CBC encryption support
- Comprehensive test suite (>90% coverage)

**Features**:
- Simple API: `send(title, message)`
- Advanced API: `send(options)`
- Support for types, tags, images, action URLs
- Authentication via API tokens
- Custom base URL for testing

## Development

### Setup

```bash
# Clone repository
git clone https://gitlab.com/wirepusher/wirepusher-js.git
cd wirepusher-js

# Install dependencies
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

Outputs:
- `dist/index.js` - ESM build
- `dist/index.cjs` - CommonJS build
- `dist/index.d.ts` - TypeScript definitions (ESM)
- `dist/index.d.cts` - TypeScript definitions (CJS)

## Common Development Tasks

### Adding a Feature

1. Add implementation to `src/client.ts`
2. Update TypeScript types in `src/types.ts`
3. Export in `src/index.ts` if needed
4. Add tests in `tests/client.test.ts`
5. Update README with examples
6. Add to CHANGELOG

### Adding an Error Type

1. Add class to `src/errors.ts`
2. Extend `WirePusherError` base class
3. Update error handling in `client.ts`
4. Export in `src/index.ts`
5. Add tests in `tests/errors.test.ts`
6. Update README error handling section

### Updating Types

1. Modify interfaces in `src/types.ts`
2. Add JSDoc comments
3. Update client implementation
4. Run `npm run typecheck`
5. Update README documentation
6. Add to CHANGELOG

## Testing Philosophy

- **Unit tests**: Test client methods in isolation
- **Mock fetch**: Use Vitest mocking for fetch API
- **Type safety**: Run TypeScript compiler (`typecheck`)
- **Coverage target**: >90% for statements, branches, functions, lines
- **Test naming**: Descriptive `it('should ...')` statements

## API Integration

### Endpoints

- `POST /send` - Send notifications

### Authentication

Token via `token` parameter in constructor.

### Response Format

**Success response:**
```json
{
  "status": "success",
  "message": "Notification sent successfully"
}
```

**Error response:**
```json
{
  "status": "error",
  "error": {
    "type": "validation_error",
    "code": "missing_required_field",
    "message": "Title is required",
    "param": "title"
  }
}
```

The library parses both flat and nested error formats for backward compatibility.

## Package Publishing

**npm package**: `@wirepusher/client`

**package.json exports**:
```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  }
}
```

**Published files**:
- `dist/` directory only (via `files` field)

## Framework Integration Examples

### Express.js

```typescript
import express from 'express';
import { WirePusher } from 'wirepusher';

const app = express();
const client = new WirePusher({ token: process.env.WIREPUSHER_TOKEN! });

app.post('/deploy', async (req, res) => {
  await client.send('Deploy Complete', `Version ${req.body.version}`);
  res.json({ status: 'success' });
});
```

### Next.js API Route

```typescript
// app/api/notify/route.ts
import { WirePusher } from 'wirepusher';
import { NextResponse } from 'next/server';

const client = new WirePusher({ token: process.env.WIREPUSHER_TOKEN! });

export async function POST(request: Request) {
  const { title, message } = await request.json();
  await client.send(title, message);
  return NextResponse.json({ success: true });
}
```

## Notes for AI Assistants

- **Zero dependencies**: Keep runtime dependency-free (use native APIs)
- **TypeScript-first**: Always add proper types and JSDoc comments
- **Dual package**: Ensure ESM/CJS compatibility (test both)
- **Native fetch**: Use fetch API, not axios or other HTTP clients
- **Error handling**: Use custom error classes, not generic Error
- **Testing**: Write tests for all features (>90% coverage)
- **Documentation**: Update README for user-facing changes
- **Formatting**: Use Prettier and ESLint (run before committing)
- **Type safety**: Run `npm run typecheck` before committing
- **Build verification**: Run `npm run build` to verify dual package output

## Project Status

**Current**: Production-ready v1.0.0

**Completed**:
- ✅ TypeScript implementation with full type safety
- ✅ Zero runtime dependencies (native fetch)
- ✅ Dual package support (ESM/CJS)
- ✅ Custom error classes
- ✅ AES-128-CBC encryption
- ✅ Comprehensive test suite (>90% coverage)
- ✅ Method overloading for flexible API
- ✅ Timeout handling with AbortController
- ✅ Complete documentation
- ✅ CI/CD with Cloud Build

**Not Implemented**:
- ❌ NotifAI endpoint (not yet available in v1 API)
- ❌ Automatic retry logic (can be added in future)
- ❌ Rate limit handling (can be added if needed)
- ❌ Config file support (not needed for library)

## Links

- **Repository**: https://gitlab.com/wirepusher/wirepusher-js
- **Issues**: https://gitlab.com/wirepusher/wirepusher-js/-/issues
- **npm Package**: https://www.npmjs.com/package/@wirepusher/client
- **API Docs**: https://wirepusher.com/docs
- **App**: https://wirepusher.dev
