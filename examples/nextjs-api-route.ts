/**
 * Next.js API Route Example
 *
 * This example shows how to use WirePusher in Next.js App Router API routes.
 * Works with Next.js 13+ (App Router).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  WirePusher,
  WirePusherAuthError,
  WirePusherValidationError,
  WirePusherError,
} from 'wirepusher';

// Initialize WirePusher client (singleton pattern)
// This client instance is reused across requests
const notificationClient = new WirePusher({
  token: process.env.WIREPUSHER_TOKEN!,
  timeout: 30000,
});

/**
 * Simple notification endpoint
 * POST /api/notify
 *
 * Body:
 * {
 *   "title": "Notification Title",
 *   "message": "Notification message"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, type, tags, imageURL, actionURL } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: title and message' },
        { status: 400 }
      );
    }

    // Send notification
    const response = await notificationClient.send({
      title,
      message,
      type,
      tags,
      imageURL,
      actionURL,
    });

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('Failed to send notification:', error);

    // Handle specific error types
    if (error instanceof WirePusherAuthError) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: 'Invalid WirePusher credentials',
        },
        { status: 401 }
      );
    }

    if (error instanceof WirePusherValidationError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: error.message,
        },
        { status: 400 }
      );
    }

    if (error instanceof WirePusherError) {
      return NextResponse.json(
        {
          error: 'Failed to send notification',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Alternative: Pages Router API Route
 * /pages/api/notify.ts
 *
 * Uncomment and use this for Next.js Pages Router:
 */

/*
import type { NextApiRequest, NextApiResponse } from 'next';
import { WirePusher, WirePusherError } from 'wirepusher';

const notificationClient = new WirePusher({
  token: process.env.WIREPUSHER_TOKEN!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('Failed to send notification:', error);

    if (error instanceof WirePusherError) {
      return res.status(500).json({
        error: 'Failed to send notification',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
*/

/**
 * Example: Server Action (Next.js 13+ App Router)
 * /app/actions/notify.ts
 *
 * Use this for Server Actions:
 */

/*
'use server';

import { WirePusher } from 'wirepusher';

const notificationClient = new WirePusher({
  token: process.env.WIREPUSHER_TOKEN!,
});

export async function sendNotification(formData: FormData) {
  const title = formData.get('title') as string;
  const message = formData.get('message') as string;

  if (!title || !message) {
    throw new Error('Missing required fields');
  }

  try {
    const response = await notificationClient.send(title, message);
    return { success: true, response };
  } catch (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
}
*/

/**
 * Example: Client Component using the API route
 * /app/components/NotificationForm.tsx
 *
 * Use this in your client components:
 */

/*
'use client';

import { useState } from 'react';

export default function NotificationForm() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      setStatus('success');
      setTitle('');
      setMessage('');

      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="message" className="block font-medium">
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={4}
          required
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending...' : 'Send Notification'}
      </button>

      {status === 'success' && (
        <p className="text-green-600">Notification sent successfully!</p>
      )}

      {status === 'error' && (
        <p className="text-red-600">Failed to send notification</p>
      )}
    </form>
  );
}
*/
