# WirePusher JavaScript SDK

Official JavaScript/TypeScript SDK for [WirePusher](https://wirepusher.com) - Send push notifications to your mobile devices.

## Features

- **Zero Dependencies** - Uses native fetch API (Node.js 18+)
- **TypeScript Support** - Full type safety with TypeScript definitions
- **Dual Package** - Supports both ES Modules and CommonJS
- **Simple API** - Clean, intuitive interface for sending notifications
- **Error Handling** - Comprehensive error types for better debugging
- **Timeout Control** - Configurable request timeouts with AbortController
- **Well Tested** - >90% test coverage
- **Tree-Shakeable** - ES modules enable optimal bundling

## Requirements

- Node.js >= 18.0.0 (for native fetch support)

## Installation

```bash
npm install wirepusher
```

## Quick Start

### ES Modules (TypeScript/Modern Node.js)

```typescript
import { WirePusher } from 'wirepusher';

// Using user ID for personal notifications
const client = new WirePusher({ userId: 'your_user_id' });

// Send a simple notification
await client.send('Build Complete', 'v1.2.3 deployed successfully');
```

### CommonJS (Traditional Node.js)

```javascript
const { WirePusher } = require('wirepusher');

// Using user ID for personal notifications
const client = new WirePusher({ userId: 'your_user_id' });

// Send a simple notification
client.send('Build Complete', 'v1.2.3 deployed successfully')
  .then(() => console.log('Notification sent!'))
  .catch(error => console.error('Failed:', error));
```

## Usage Examples

### Simple Notification

```typescript
import { WirePusher } from 'wirepusher';

const client = new WirePusher({ userId: 'your_user_id' });

// Basic notification
await client.send('Hello', 'World!');
```

### Advanced Notification with All Options

```typescript
await client.send({
  title: 'Deploy Complete',
  message: 'Version 1.2.3 deployed to production',
  type: 'deployment',
  tags: ['production', 'release'],
  imageURL: 'https://example.com/success.png',
  actionURL: 'https://example.com/deployment/123'
});
```

### Custom Configuration

```typescript
const client = new WirePusher({
  token: 'wpt_your_token_here',
  timeout: 60000, // 60 seconds (default: 30000)
  baseUrl: 'https://custom-gateway.example.com', // Optional
});
```

## Authentication

WirePusher supports two authentication methods for sending notifications:

### Team Tokens (Recommended for Teams)

Team tokens (starting with `wpt_`) send notifications to ALL members of a team.

```typescript
import { WirePusher } from 'wirepusher';

// Send to all team members
const client = new WirePusher({ token: 'wpt_abc123xyz...' });
await client.send('Team Alert', 'Server maintenance in 1 hour');
```

**Use cases:**
- Team-wide alerts and announcements
- Shared project notifications
- Collaborative workflows

### User ID (Personal Notifications)

User IDs send notifications to a specific user's devices only.

```typescript
import { WirePusher } from 'wirepusher';

// Send to specific user
const client = new WirePusher({ userId: 'user_abc123' });
await client.send('Personal Reminder', 'Your task is due tomorrow');
```

**Use cases:**
- Personal notifications
- User-specific alerts
- Individual reminders

**Note:** Team tokens and user IDs are mutually exclusive - use one or the other, not both.

## Encrypted Notifications

WirePusher supports AES-128-CBC encryption for secure message delivery. Only the message content is encrypted; metadata (title, type, tags) remains unencrypted for filtering and display.

### Setup

1. Create a notification type in the WirePusher app
2. Set an encryption password for that type
3. Use the same password when sending encrypted notifications

### Example

```typescript
import { WirePusher } from 'wirepusher';

const client = new WirePusher({ userId: 'your_user_id' });

await client.send({
  title: 'Secure Message',              // Not encrypted (for display)
  message: 'Sensitive information here', // Encrypted
  type: 'secure',                        // Must match app type with password
  encryptionPassword: 'your_password'    // Must match app configuration
});
```

### What's Encrypted

- ✅ Message content only
- ❌ Title, type, tags, imageURL, actionURL (unencrypted for filtering/display)

### Security Notes

- Message content encrypted using AES-128-CBC
- 16-byte random IV generated for each message
- Password must match the type configuration in the app
- Use strong passwords (minimum 12 characters)
- Store passwords securely (environment variables, secret managers)

### Advanced Encryption Example

```typescript
import { WirePusher } from 'wirepusher';

// Store password in environment variable
const encryptionPassword = process.env.WIREPUSHER_ENCRYPTION_PASSWORD;

const client = new WirePusher({ userId: 'your_user_id' });

// Send encrypted notification
const response = await client.send({
  title: 'Security Alert',
  message: 'Unauthorized access attempt detected from IP 192.168.1.100',
  type: 'security',
  tags: ['critical', 'security'],
  encryptionPassword
});

console.log(`Encrypted notification sent: ${response.status}`);
```

### Error Handling

```typescript
import {
  WirePusher,
  WirePusherAuthError,
  WirePusherValidationError,
  WirePusherError
} from 'wirepusher';

const client = new WirePusher({
  token: 'wpt_your_token_here',
  userId: 'your_user_id',
});

try {
  await client.send('Test', 'Message');
} catch (error) {
  if (error instanceof WirePusherAuthError) {
    console.error('Authentication failed:', error.message);
    // Handle invalid token or user ID
  } else if (error instanceof WirePusherValidationError) {
    console.error('Invalid parameters:', error.message);
    // Handle validation errors
  } else if (error instanceof WirePusherError) {
    console.error('API error:', error.message);
    // Handle other API errors
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Express.js Integration

```typescript
import express from 'express';
import { WirePusher } from 'wirepusher';

const app = express();
const client = new WirePusher({ userId: process.env.WIREPUSHER_USER_ID! });

app.post('/deploy', async (req, res) => {
  try {
    await client.send({
      title: 'Deploy Started',
      message: `Deploying ${req.body.version}`,
      type: 'deployment',
      tags: ['ci/cd']
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to send notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});
```

### Next.js API Route

```typescript
// app/api/notify/route.ts
import { WirePusher } from 'wirepusher';
import { NextResponse } from 'next/server';

const client = new WirePusher({ userId: process.env.WIREPUSHER_USER_ID! });

export async function POST(request: Request) {
  try {
    const { title, message } = await request.json();
    await client.send(title, message);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
```

## API Reference

### `WirePusher`

Main client class for sending notifications.

#### Constructor

```typescript
new WirePusher(config: ClientConfig)
```

**Parameters:**

- `config.token` (optional): Your WirePusher team token (starts with `wpt_`) - mutually exclusive with `userId`
- `config.userId` (optional): Your WirePusher user ID - mutually exclusive with `token`
- `config.timeout` (optional): Request timeout in milliseconds (default: 30000)
- `config.baseUrl` (optional): Custom API gateway URL (default: https://wirepusher.com)

**Note:** You must specify either `token` OR `userId`, not both.

#### Methods

##### `send(title, message)`

Send a simple notification with title and message.

```typescript
await client.send(
  title: string,
  message: string
): Promise<NotificationResponse>
```

##### `send(options)`

Send a notification with full options.

```typescript
await client.send(options: NotificationOptions): Promise<NotificationResponse>
```

**Options:**

- `title` (required): Notification title
- `message` (required): Notification message
- `type` (optional): Custom notification type for categorization
- `tags` (optional): Array of tags for filtering
- `imageURL` (optional): URL to an image to display
- `actionURL` (optional): URL to open when notification is tapped
- `encryptionPassword` (optional): Password for AES-128-CBC encryption (must match type configuration in app)

**Returns:**

```typescript
{
  status: 'success',
  message: string
}
```

### Error Types

- `WirePusherError`: Base error class for all SDK errors
- `WirePusherAuthError`: Authentication failures (401, 403)
- `WirePusherValidationError`: Invalid parameters (400, 404)

## Best Practices

### Environment Variables

Store sensitive credentials in environment variables:

```bash
# .env
WIREPUSHER_USER_ID=your_user_id
# OR for team notifications:
# WIREPUSHER_TOKEN=wpt_your_token_here
```

```typescript
import { WirePusher } from 'wirepusher';

// Personal notifications
const client = new WirePusher({ userId: process.env.WIREPUSHER_USER_ID! });

// OR for team notifications:
// const client = new WirePusher({ token: process.env.WIREPUSHER_TOKEN! });
```

### Reuse Client Instances

Create a single client instance and reuse it:

```typescript
// notification.ts
import { WirePusher } from 'wirepusher';

export const notificationClient = new WirePusher({
  userId: process.env.WIREPUSHER_USER_ID!,
});

// other-file.ts
import { notificationClient } from './notification';

await notificationClient.send('Event', 'Something happened');
```

### Error Logging

Always log errors for debugging:

```typescript
try {
  await client.send('Title', 'Message');
} catch (error) {
  console.error('Failed to send notification:', {
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  });
  // Don't throw - notification failures shouldn't break your app
}
```

### Timeout Configuration

Adjust timeouts based on your needs:

```typescript
// For critical notifications that need to arrive
const client = new WirePusher({
  userId: process.env.WIREPUSHER_USER_ID!,
  timeout: 60000, // Wait up to 60 seconds
});

// For non-critical notifications
const fastClient = new WirePusher({
  userId: process.env.WIREPUSHER_USER_ID!,
  timeout: 5000, // Fail fast after 5 seconds
});
```

## Development

### Setup

```bash
git clone https://gitlab.com/wirepusher/javascript-sdk.git
cd javascript-sdk
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building

```bash
# Build dual package (CJS + ESM)
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

### Project Structure

```
javascript-sdk/
├── src/
│   ├── client.ts       # Main WirePusher client
│   ├── errors.ts       # Error classes
│   ├── types.ts        # TypeScript interfaces
│   └── index.ts        # Public API exports
├── tests/
│   ├── client.test.ts  # Client tests
│   └── errors.test.ts  # Error tests
├── dist/               # Built package (CJS + ESM)
├── examples/           # Usage examples
└── package.json
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Security

For security issues, please see [SECURITY.md](SECURITY.md).

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [WirePusher Website](https://wirepusher.com)
- [API Documentation](https://wirepusher.com/api)
- [Issue Tracker](https://gitlab.com/wirepusher/javascript-sdk/-/issues)
- [GitLab Repository](https://gitlab.com/wirepusher/javascript-sdk)

## Support

- Email: support@wirepusher.com
- Issues: https://gitlab.com/wirepusher/javascript-sdk/-/issues
