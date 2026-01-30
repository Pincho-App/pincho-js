/**
 * Rate Limits Example
 *
 * Demonstrates how to monitor and manage rate limiting when using the Pincho client.
 * Shows proactive rate limit checking and handling.
 */

import { Pincho, type RateLimitInfo } from 'pincho';

// Initialize client
const client = new Pincho({
  token: process.env.PINCHO_TOKEN || 'abc12345',
});

async function main() {
  console.log('Pincho Rate Limits Example\n');

  // Example 1: Basic rate limit monitoring
  console.log('Example 1: Basic Rate Limit Monitoring');
  console.log('-'.repeat(40));

  try {
    await client.send('Test', 'Rate limit test notification');

    const info = client.getRateLimitInfo();
    if (info) {
      console.log('Rate Limit Information:');
      console.log(`  Limit: ${info.limit} requests per window`);
      console.log(`  Remaining: ${info.remaining} requests`);
      console.log(`  Resets at: ${info.reset.toISOString()}`);
      console.log(`  Time until reset: ${formatTimeUntilReset(info.reset)}`);
    } else {
      console.log('No rate limit info available (first request may not have completed)');
    }
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n');

  // Example 2: Proactive rate limit checking
  console.log('Example 2: Proactive Rate Limit Checking');
  console.log('-'.repeat(40));

  await sendWithRateLimitCheck(client, 'Alert', 'CPU usage high');

  console.log('\n');

  // Example 3: Batch sending with rate limit awareness
  console.log('Example 3: Batch Sending with Rate Limit Awareness');
  console.log('-'.repeat(40));

  const notifications = [
    { title: 'Batch 1', message: 'First notification' },
    { title: 'Batch 2', message: 'Second notification' },
    { title: 'Batch 3', message: 'Third notification' },
  ];

  await sendBatchWithRateLimitAwareness(client, notifications);

  console.log('\n');

  // Example 4: Monitor rate limit consumption
  console.log('Example 4: Monitor Rate Limit Consumption');
  console.log('-'.repeat(40));

  await monitorRateLimitConsumption(client);

  console.log('\n');

  // Example 5: Display final rate limit status
  console.log('Example 5: Final Rate Limit Status');
  console.log('-'.repeat(40));

  displayRateLimitStatus(client);
}

/**
 * Format time until rate limit reset
 */
function formatTimeUntilReset(resetTime: Date): string {
  const now = Date.now();
  const resetMs = resetTime.getTime();
  const diffMs = resetMs - now;

  if (diffMs <= 0) {
    return 'Already reset';
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Send notification with proactive rate limit checking
 */
async function sendWithRateLimitCheck(
  client: Pincho,
  title: string,
  message: string
): Promise<void> {
  const info = client.getRateLimitInfo();

  // Check if we're close to the limit
  if (info) {
    if (info.remaining === 0) {
      const waitTime = info.reset.getTime() - Date.now();
      console.log(`Rate limit exhausted. Would need to wait ${formatTimeUntilReset(info.reset)}`);
      console.log('Skipping this send to avoid rate limit error...');
      return;
    }

    if (info.remaining < 5) {
      console.log(`Warning: Only ${info.remaining} requests remaining in this window`);
    }
  }

  try {
    await client.send(title, message);
    console.log(`Sent: "${title}"`);

    const newInfo = client.getRateLimitInfo();
    if (newInfo) {
      console.log(`Remaining requests: ${newInfo.remaining}/${newInfo.limit}`);
    }
  } catch (error) {
    console.error('Failed to send:', error);
  }
}

/**
 * Send batch of notifications with rate limit awareness
 */
async function sendBatchWithRateLimitAwareness(
  client: Pincho,
  notifications: Array<{ title: string; message: string }>
): Promise<void> {
  let sent = 0;
  let skipped = 0;

  for (const notif of notifications) {
    const info = client.getRateLimitInfo();

    // Check if we have enough capacity
    if (info && info.remaining === 0) {
      console.log(`Rate limited. Skipping "${notif.title}"`);
      skipped++;
      continue;
    }

    try {
      await client.send(notif.title, notif.message);
      sent++;
      console.log(`Sent: "${notif.title}"`);

      const newInfo = client.getRateLimitInfo();
      if (newInfo) {
        console.log(`  Remaining: ${newInfo.remaining}/${newInfo.limit}`);
      }
    } catch (error) {
      console.error(`Failed to send "${notif.title}":`, error);
    }

    // Small delay between requests
    await sleep(100);
  }

  console.log(`\nBatch complete: ${sent} sent, ${skipped} skipped`);
}

/**
 * Monitor rate limit consumption over multiple requests
 */
async function monitorRateLimitConsumption(client: Pincho): Promise<void> {
  const initialInfo = client.getRateLimitInfo();
  const startRemaining = initialInfo?.remaining ?? 0;

  console.log(`Starting remaining: ${startRemaining}`);

  // Send a single test notification
  try {
    await client.send('Monitor', 'Rate limit monitoring test');

    const afterInfo = client.getRateLimitInfo();
    if (afterInfo && initialInfo) {
      const consumed = initialInfo.remaining - afterInfo.remaining;
      console.log(`After 1 request: ${afterInfo.remaining} remaining`);
      console.log(`Consumed: ${consumed} request(s)`);

      // Calculate capacity
      const percentRemaining = (afterInfo.remaining / afterInfo.limit) * 100;
      console.log(`Capacity: ${percentRemaining.toFixed(1)}% remaining`);
    }
  } catch (error) {
    console.error('Monitoring request failed:', error);
  }
}

/**
 * Display comprehensive rate limit status
 */
function displayRateLimitStatus(client: Pincho): void {
  const info = client.getRateLimitInfo();

  if (!info) {
    console.log('No rate limit information available');
    return;
  }

  const percentRemaining = (info.remaining / info.limit) * 100;
  const timeUntilReset = formatTimeUntilReset(info.reset);

  console.log('Rate Limit Status:');
  console.log(`  Limit: ${info.limit} requests/window`);
  console.log(`  Remaining: ${info.remaining} requests (${percentRemaining.toFixed(1)}%)`);
  console.log(`  Reset: ${info.reset.toISOString()}`);
  console.log(`  Time until reset: ${timeUntilReset}`);

  // Status indicator
  if (percentRemaining > 50) {
    console.log('\n  Status: OK - Plenty of capacity');
  } else if (percentRemaining > 20) {
    console.log('\n  Status: WARNING - Consider spacing out requests');
  } else if (percentRemaining > 0) {
    console.log('\n  Status: CRITICAL - Very limited capacity');
  } else {
    console.log('\n  Status: EXHAUSTED - Wait for reset');
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run examples
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
