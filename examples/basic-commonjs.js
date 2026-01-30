/**
 * Basic CommonJS Example
 *
 * This example shows how to use Pincho Client Library in a CommonJS environment.
 * Suitable for traditional Node.js applications.
 */

const { Pincho } = require('pincho');

// Initialize the client
const client = new Pincho({
  token: process.env.PINCHO_TOKEN || 'abc12345',
});

// Example 1: Simple notification
async function sendSimpleNotification() {
  try {
    const response = await client.send('Hello', 'This is a test notification!');
    console.log('Notification sent:', response);
  } catch (error) {
    console.error('Error sending notification:', error.message);
  }
}

// Example 2: Notification with all options
async function sendAdvancedNotification() {
  try {
    const response = await client.send({
      title: 'Deploy Complete',
      message: 'Version 1.2.3 has been deployed to production',
      type: 'deployment',
      tags: ['production', 'release', 'v1.2.3'],
      imageURL: 'https://example.com/success.png',
      actionURL: 'https://example.com/deployment/123',
    });
    console.log('Advanced notification sent:', response);
  } catch (error) {
    console.error('Error sending notification:', error.message);
  }
}

// Run examples
async function main() {
  console.log('Pincho CommonJS Example\n');

  await sendSimpleNotification();
  console.log('---');

  await sendAdvancedNotification();
}

main();
