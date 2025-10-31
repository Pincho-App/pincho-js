# WirePusher JavaScript SDK

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/wirepusher.svg)](https://www.npmjs.com/package/wirepusher)

Official JavaScript/TypeScript SDK for [WirePusher](https://wirepusher.dev) push notifications.

## Features

- ✅ **Zero Dependencies** - Uses native fetch API
- ✅ **TypeScript Support** - Full type safety with TypeScript definitions
- ✅ **Dual Package** - Supports both ES Modules and CommonJS
- ✅ **Simple API** - Clean, intuitive interface
- ✅ **Modern** - Node.js 18+, supports HTTP/2
- ✅ **Well-Tested** - >90% test coverage

## Installation

```bash
npm install wirepusher
```

## Quick Start

```typescript
import { WirePusher } from 'wirepusher';

// Initialize with your token
const client = new WirePusher({ token: 'wpu_YOUR_TOKEN' });

await client.send(
  'Deploy Complete',
  'Version 1.2.3 deployed to production'
);
```

**Get your token:** Open app → Settings → Help → copy token

## Usage

### Basic Example

```typescript
import { WirePusher } from 'wirepusher';

const client = new WirePusher({ token: 'wpu_abc123xyz' });

const response = await client.send(
  'Deploy Complete',
  'Version 1.2.3 deployed to production'
);

console.log(response.status); // 'success'
```

### All Parameters

```typescript
import { WirePusher } from 'wirepusher';

const client = new WirePusher({ token: 'wpu_abc123xyz' });

await client.send({
  title: 'Deploy Complete',
  message: 'Version 1.2.3 deployed to production',
  type: 'deployment',
  tags: ['production', 'backend'],
  imageURL: 'https://cdn.example.com/success.png',
  actionURL: 'https://dash.example.com/deploy/123'
});
```

### CommonJS

```javascript
const { WirePusher } = require('wirepusher');

const client = new WirePusher({ token: process.env.WIREPUSHER_TOKEN });

client.send('Deploy Complete', 'Version 1.2.3 deployed to production')
  .then(() => console.log('Sent!'))
  .catch(error => console.error('Failed:', error));
```

## Encryption

Encrypt notification messages using AES-128-CBC. Only the `message` field is encrypted—`title`, `type`, `tags`, `imageURL`, and `actionURL` remain unencrypted for filtering and display.

**Setup:**
1. In the app, create a notification type
2. Set an encryption password for that type
3. Pass the same `type` and password when sending

```typescript
import { WirePusher } from 'wirepusher';

const encryptionPassword = process.env.WIREPUSHER_ENCRYPTION_PASSWORD!;
const client = new WirePusher({ token: 'wpu_abc123xyz' });

await client.send({
  title: 'Security Alert',
  message: 'Unauthorized access attempt detected',
  type: 'security',
  encryptionPassword
});
```

**Security notes:**
- Use strong passwords (minimum 12 characters)
- Store passwords securely (environment variables, secret managers)
- Password must match the type configuration in the app

## API Reference

### WirePusher

**Constructor Parameters:**
- `token` (string, required): Your WirePusher token (starts with `wpu_` or `wpt_`)
- `deviceId` (string, optional): Legacy device ID (deprecated, use token instead)
- `timeout` (number, optional): Request timeout in milliseconds (default: 30000)
- `baseUrl` (string, optional): Custom base URL for testing

### send()

Send a notification.

**Overload 1: Simple**
```typescript
send(title: string, message: string): Promise<NotificationResponse>
```

**Overload 2: Full options**
```typescript
send(options: NotificationOptions): Promise<NotificationResponse>
```

**NotificationOptions:**
- `title` (string, required): Notification title
- `message` (string, required): Notification message
- `type` (string, optional): Category for organization
- `tags` (string[], optional): Tags for filtering
- `imageURL` (string, optional): Image URL to display
- `actionURL` (string, optional): URL to open when tapped
- `encryptionPassword` (string, optional): Password for encryption

**Returns:**
- `NotificationResponse`: Object with `status` and `message` fields

**Throws:**
- `WirePusherAuthError`: Invalid token (401, 403)
- `WirePusherValidationError`: Invalid parameters (400, 404)
- `WirePusherError`: Other API errors

## Error Handling

```typescript
import {
  WirePusher,
  WirePusherError,
  WirePusherAuthError,
  WirePusherValidationError
} from 'wirepusher';

const client = new WirePusher({ token: 'wpu_abc123xyz' });

try {
  await client.send('Deploy Complete', 'Version 1.2.3 deployed');
} catch (error) {
  if (error instanceof WirePusherAuthError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof WirePusherValidationError) {
    console.error('Invalid parameters:', error.message);
  } else if (error instanceof WirePusherError) {
    console.error('API error:', error.message);
  }
}
```

## Examples

### CI/CD Pipeline

```typescript
import { WirePusher } from 'wirepusher';

function notifyDeployment(version: string, environment: string) {
  const token = process.env.WIREPUSHER_TOKEN!;
  const client = new WirePusher({ token });

  await client.send({
    title: 'Deploy Complete',
    message: `Version ${version} deployed to ${environment}`,
    type: 'deployment',
    tags: [environment, version]
  });
}

// In your CI/CD script
notifyDeployment('1.2.3', 'production');
```

### Server Monitoring

```typescript
import { WirePusher } from 'wirepusher';
import os from 'os';

async function checkServerHealth() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
  const memoryUsage = (1 - os.freemem() / os.totalmem()) * 100;

  if (cpuUsage > 80 || memoryUsage > 80) {
    const token = process.env.WIREPUSHER_TOKEN!;
    const client = new WirePusher({ token });

    await client.send({
      title: 'Server Alert',
      message: `CPU: ${cpuUsage.toFixed(1)}%, Memory: ${memoryUsage.toFixed(1)}%`,
      type: 'alert',
      tags: ['server', 'critical']
    });
  }
}
```

### Express.js Integration

```typescript
import express from 'express';
import { WirePusher } from 'wirepusher';

const app = express();
const client = new WirePusher({ token: process.env.WIREPUSHER_TOKEN! });

app.post('/deploy', async (req, res) => {
  const { version } = req.body;

  // Your deployment logic here

  try {
    await client.send({
      title: 'Deploy Complete',
      message: `Version ${version} deployed to production`,
      type: 'deployment'
    });
    res.json({ status: 'success' });
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

const client = new WirePusher({ token: process.env.WIREPUSHER_TOKEN! });

export async function POST(request: Request) {
  const { title, message } = await request.json();

  try {
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

## Development

### Setup

```bash
# Clone repository
git clone https://gitlab.com/wirepusher/javascript-sdk.git
cd javascript-sdk

# Install dependencies
npm install
```

### Testing

```bash
# Run tests with coverage
npm test

# Watch mode
npm run test:watch

# Type checking
npm run typecheck

# Linting
npm run lint

# Formatting
npm run format
```

## Requirements

- Node.js 18+ (native fetch support)

## Links

- **Documentation**: https://wirepusher.dev/help
- **Repository**: https://gitlab.com/wirepusher/javascript-sdk
- **Issues**: https://gitlab.com/wirepusher/javascript-sdk/-/issues
- **npm**: https://www.npmjs.com/package/wirepusher

## License

MIT License - see [LICENSE](LICENSE) file for details.
