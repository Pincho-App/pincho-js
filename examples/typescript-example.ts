/**
 * TypeScript Example
 *
 * This example demonstrates type-safe usage of the Pincho Client Library.
 * Shows proper error handling with custom error types.
 */

import {
  Pincho,
  PinchoAuthError,
  PinchoValidationError,
  PinchoError,
  type NotificationOptions,
  type NotificationResponse,
} from 'pincho';

// Initialize the client with type safety
const client = new Pincho({
  token: process.env.PINCHO_TOKEN || 'abc12345',
  timeout: 30000, // Optional: custom timeout
});

// Example 1: Type-safe simple notification
async function sendSimpleNotification(): Promise<void> {
  try {
    const response: NotificationResponse = await client.send(
      'Hello TypeScript',
      'This is a type-safe notification!'
    );
    console.log('Notification sent:', response);
  } catch (error) {
    handleError(error);
  }
}

// Example 2: Type-safe notification with options
async function sendAdvancedNotification(): Promise<void> {
  const options: NotificationOptions = {
    title: 'Build Status',
    message: 'Build #42 completed successfully',
    type: 'ci/cd',
    tags: ['build', 'success', 'production'],
    imageURL: 'https://example.com/build-success.png',
    actionURL: 'https://ci.example.com/build/42',
  };

  try {
    const response = await client.send(options);
    console.log('Advanced notification sent:', response);
  } catch (error) {
    handleError(error);
  }
}

// Example 3: Comprehensive error handling
function handleError(error: unknown): void {
  if (error instanceof PinchoAuthError) {
    console.error('❌ Authentication failed:', error.message);
    console.error('   Please check your token');
    // Handle auth errors - maybe refresh credentials
  } else if (error instanceof PinchoValidationError) {
    console.error('❌ Validation error:', error.message);
    console.error('   Please check your notification parameters');
    // Handle validation errors - fix the input
  } else if (error instanceof PinchoError) {
    console.error('❌ API error:', error.message);
    console.error('   The Pincho service may be unavailable');
    // Handle general API errors - maybe retry
  } else if (error instanceof Error) {
    console.error('❌ Unexpected error:', error.message);
    // Handle unknown errors
  } else {
    console.error('❌ Unknown error:', error);
  }
}

// Example 4: Batch notifications with error recovery
async function sendBatchNotifications(
  notifications: NotificationOptions[]
): Promise<void> {
  const results = await Promise.allSettled(
    notifications.map((notif) => client.send(notif))
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`✓ Notification ${index + 1} sent:`, result.value);
    } else {
      console.error(`✗ Notification ${index + 1} failed:`, result.reason);
    }
  });
}

// Example 5: Reusable notification factory
function createNotification(
  title: string,
  message: string,
  type: string
): NotificationOptions {
  return {
    title,
    message,
    type,
    tags: [type, new Date().toISOString().split('T')[0]],
  };
}

// Run examples
async function main(): Promise<void> {
  console.log('Pincho TypeScript Example\n');

  // Simple notification
  await sendSimpleNotification();
  console.log('---');

  // Advanced notification
  await sendAdvancedNotification();
  console.log('---');

  // Batch notifications
  const batch: NotificationOptions[] = [
    createNotification('Test 1', 'First test notification', 'test'),
    createNotification('Test 2', 'Second test notification', 'test'),
    createNotification('Test 3', 'Third test notification', 'test'),
  ];

  await sendBatchNotifications(batch);
}

main().catch(console.error);
