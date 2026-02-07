/**
 * Encryption Example
 *
 * Demonstrates how to send encrypted notifications using the Pincho Client Library.
 * Encrypted fields: title, message, imageURL, actionURL.
 * Type and tags remain unencrypted for filtering and routing.
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
      title: 'Secure Message', // Encrypted
      message: 'This is sensitive information', // Encrypted
      type: 'secure', // NOT encrypted (needed for password lookup)
      encryptionPassword: ENCRYPTION_PASSWORD,
    });
    console.log(`✅ Sent: ${response1.status}\n`);
  } catch (error) {
    console.error(`❌ Failed: ${error}\n`);
  }

  // Example 2: Encrypted security alert with tags
  console.log('Example 2: Encrypted notification with tags');
  try {
    const response2 = await client.send({
      title: 'Security Alert', // Encrypted
      message: 'Unauthorized access attempt detected from IP 192.168.1.100', // Encrypted
      type: 'security', // NOT encrypted (for filtering)
      tags: ['critical', 'security', 'urgent'], // NOT encrypted (for filtering)
      encryptionPassword: ENCRYPTION_PASSWORD,
    });
    console.log(`✅ Sent: ${response2.status}\n`);
  } catch (error) {
    console.error(`❌ Failed: ${error}\n`);
  }

  // Example 3: Encrypted message with image and action URL
  console.log('Example 3: Encrypted notification with URLs');
  try {
    const response3 = await client.send({
      title: 'Confidential Report', // Encrypted
      message: 'Q4 revenue increased by 25% - see attached report for details', // Encrypted
      type: 'finance', // NOT encrypted
      imageURL: 'https://example.com/chart.png', // Encrypted
      actionURL: 'https://example.com/reports/q4', // Encrypted
      tags: ['finance', 'quarterly'], // NOT encrypted
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
  console.log('   - Encrypted fields: title, message, imageURL, actionURL');
  console.log('   - NOT encrypted: type, tags (needed for filtering/routing)');
  console.log('   - A random 16-byte IV is generated for each notification');
  console.log('   - Uses AES-128-CBC encryption matching mobile app');
  console.log('   - Encryption password must match the type configuration in the app');
  console.log('   - Store passwords securely (environment variables, secret managers)');
  console.log('   - Use strong passwords (minimum 12 characters)\n');
}

// Run examples
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
