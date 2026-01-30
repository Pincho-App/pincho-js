/**
 * Encryption Example
 *
 * Demonstrates how to send encrypted notifications using the Pincho Client Library.
 * Only the message content is encrypted; title, type, and other metadata remain unencrypted.
 */

import { Pincho } from 'pincho';

// Configuration
const TOKEN = process.env.PINCHO_TOKEN || 'abc12345';
const ENCRYPTION_PASSWORD = process.env.PINCHO_ENCRYPTION_PASSWORD || 'your_secure_password';

async function main() {
  // Create client
  const client = new Pincho({ token: TOKEN });

  console.log('🔐 Pincho Encryption Example\n');

  // Example 1: Basic encrypted notification
  console.log('Example 1: Basic encrypted notification');
  try {
    const response1 = await client.send({
      title: 'Secure Message',              // Not encrypted (visible for filtering/display)
      message: 'This is sensitive information', // Encrypted
      type: 'secure',                        // Not encrypted (needed for password lookup)
      encryptionPassword: ENCRYPTION_PASSWORD,
    });
    console.log(`✅ Sent: ${response1.status}\n`);
  } catch (error) {
    console.error(`❌ Failed: ${error}\n`);
  }

  // Example 2: Encrypted security alert with tags
  console.log('Example 2: Encrypted security alert with metadata');
  try {
    const response2 = await client.send({
      title: 'Security Alert',
      message: 'Unauthorized access attempt detected from IP 192.168.1.100',
      type: 'security',
      tags: ['critical', 'security', 'urgent'],
      encryptionPassword: ENCRYPTION_PASSWORD,
    });
    console.log(`✅ Sent: ${response2.status}\n`);
  } catch (error) {
    console.error(`❌ Failed: ${error}\n`);
  }

  // Example 3: Encrypted message with image and action URL
  console.log('Example 3: Encrypted notification with image and action URL');
  try {
    const response3 = await client.send({
      title: 'Confidential Report',
      message: 'Q4 revenue increased by 25% - see attached report for details',
      type: 'finance',
      imageURL: 'https://example.com/chart.png',   // Not encrypted
      actionURL: 'https://example.com/reports/q4', // Not encrypted
      tags: ['finance', 'quarterly'],
      encryptionPassword: ENCRYPTION_PASSWORD,
    });
    console.log(`✅ Sent: ${response3.status}\n`);
  } catch (error) {
    console.error(`❌ Failed: ${error}\n`);
  }

  // Example 4: Reading password from environment variable (best practice)
  console.log('Example 4: Using environment variable for password (RECOMMENDED)');
  const encryptionPassword = process.env.PINCHO_ENCRYPTION_PASSWORD;

  if (!encryptionPassword) {
    console.warn('⚠️  PINCHO_ENCRYPTION_PASSWORD not set in environment');
    console.warn('   Set it with: export PINCHO_ENCRYPTION_PASSWORD="your_password"\n');
  } else {
    try {
      const response4 = await client.send({
        title: 'Encrypted via Env Var',
        message: 'Password loaded from environment variable - this is the secure approach',
        type: 'secure',
        encryptionPassword,
      });
      console.log(`✅ Sent: ${response4.status}\n`);
    } catch (error) {
      console.error(`❌ Failed: ${error}\n`);
    }
  }

  console.log('📝 Notes:');
  console.log('   - Message content is encrypted using AES-128-CBC');
  console.log('   - A random 16-byte IV is generated for each message');
  console.log('   - Title, type, tags, imageURL, and actionURL are NOT encrypted');
  console.log('   - Encryption password must match the type configuration in the app');
  console.log('   - Store passwords securely (environment variables, secret managers)');
  console.log('   - Use strong passwords (minimum 12 characters)\n');
}

// Run examples
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
