/**
 * Express.js Integration Example
 *
 * This example shows how to integrate WirePusher into an Express.js application.
 * Includes endpoints for sending notifications and handling webhooks.
 */

import express, { Request, Response, NextFunction } from 'express';
import { WirePusher, WirePusherError } from 'wirepusher';

// Initialize Express app
const app = express();
app.use(express.json());

// Initialize WirePusher client (singleton pattern)
const notificationClient = new WirePusher({
  token: process.env.WIREPUSHER_TOKEN || 'abc12345',
  timeout: 30000,
});

// Middleware for error handling
const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Send a simple notification
app.post(
  '/notify',
  asyncHandler(async (req: Request, res: Response) => {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        error: 'Missing required fields: title and message',
      });
    }

    const response = await notificationClient.send(title, message);
    res.json({ success: true, response });
  })
);

// Send an advanced notification
app.post(
  '/notify/advanced',
  asyncHandler(async (req: Request, res: Response) => {
    const { title, message, type, tags, imageURL, actionURL } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        error: 'Missing required fields: title and message',
      });
    }

    const response = await notificationClient.send({
      title,
      message,
      type,
      tags,
      imageURL,
      actionURL,
    });

    res.json({ success: true, response });
  })
);

// Deploy notification endpoint
app.post(
  '/deploy/notify',
  asyncHandler(async (req: Request, res: Response) => {
    const { version, environment, status } = req.body;

    if (!version || !environment || !status) {
      return res.status(400).json({
        error: 'Missing required fields: version, environment, status',
      });
    }

    const emoji = status === 'success' ? '✅' : '❌';
    const title = `${emoji} Deploy ${status === 'success' ? 'Complete' : 'Failed'}`;
    const message = `Version ${version} to ${environment}`;

    const response = await notificationClient.send({
      title,
      message,
      type: 'deployment',
      tags: [environment, status, version],
      imageURL: status === 'success'
        ? 'https://example.com/success.png'
        : 'https://example.com/error.png',
      actionURL: `https://console.example.com/deploys/${version}`,
    });

    res.json({ success: true, response });
  })
);

// CI/CD build notification
app.post(
  '/ci/build',
  asyncHandler(async (req: Request, res: Response) => {
    const { buildNumber, branch, status, author } = req.body;

    const title = `Build #${buildNumber} ${status}`;
    const message = `Branch: ${branch}\nAuthor: ${author}`;

    const response = await notificationClient.send({
      title,
      message,
      type: 'ci/cd',
      tags: ['build', status, branch],
      actionURL: `https://ci.example.com/builds/${buildNumber}`,
    });

    res.json({ success: true, response });
  })
);

// Alert/monitoring endpoint
app.post(
  '/alert',
  asyncHandler(async (req: Request, res: Response) => {
    const { service, severity, metric, value, threshold } = req.body;

    const severityEmoji = {
      critical: '🔴',
      warning: '⚠️',
      info: 'ℹ️',
    }[severity] || '📊';

    const title = `${severityEmoji} ${severity.toUpperCase()}: ${service}`;
    const message = `${metric}: ${value} (threshold: ${threshold})`;

    const response = await notificationClient.send({
      title,
      message,
      type: 'alert',
      tags: [severity, service, 'monitoring'],
      actionURL: `https://monitoring.example.com/services/${service}`,
    });

    res.json({ success: true, response });
  })
);

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);

  if (error instanceof WirePusherError) {
    return res.status(500).json({
      error: 'Failed to send notification',
      message: error.message,
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ WirePusher client initialized`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  POST /notify - Send simple notification`);
  console.log(`  POST /notify/advanced - Send advanced notification`);
  console.log(`  POST /deploy/notify - Send deployment notification`);
  console.log(`  POST /ci/build - Send build notification`);
  console.log(`  POST /alert - Send monitoring alert`);
});

export default app;
