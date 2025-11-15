/**
 * Configuration options for the WirePusher client.
 */
export interface ClientConfig {
  /**
   * WirePusher token for authentication.
   * @example 'abc12345'
   */
  token: string;

  /**
   * Request timeout in milliseconds.
   * @default 30000
   */
  timeout?: number;

  /**
   * Custom base URL (mainly for testing).
   * @default 'https://wirepusher.com'
   */
  baseUrl?: string;
}

/**
 * Notification options for sending a notification.
 */
export interface NotificationOptions {
  /**
   * Notification title (max 250 characters).
   */
  title: string;

  /**
   * Notification message body (max 10,000 characters).
   */
  message: string;

  /**
   * Optional notification type for filtering/organization (max 50 characters).
   * @example 'alert'
   */
  type?: string;

  /**
   * Optional tags for flexible organization (max 10 tags, max 50 characters each).
   * @example ['production', 'critical']
   */
  tags?: string[];

  /**
   * Optional image URL to display with notification (max 2,000 characters).
   * @example 'https://example.com/image.png'
   */
  imageURL?: string;

  /**
   * Optional URL to open when notification is tapped (max 2,000 characters).
   * @example 'https://example.com/details'
   */
  actionURL?: string;

  /**
   * Optional password for AES-128-CBC encryption of message content.
   * Must match the type configuration in the WirePusher app.
   * Only the message field is encrypted; title, type, and other metadata remain unencrypted.
   * @example 'your_strong_password'
   */
  encryptionPassword?: string;
}

/**
 * Response from the WirePusher API.
 */
export interface NotificationResponse {
  /**
   * Response status (typically 'success' or 'error').
   */
  status: string;

  /**
   * Human-readable response message.
   */
  message: string;
}

/**
 * NotifAI response from the WirePusher API.
 */
export interface NotifAIResponse {
  /**
   * Response status (typically 'success' or 'error').
   */
  status: string;

  /**
   * Human-readable response message.
   */
  message: string;

  /**
   * AI-generated notification summary.
   */
  summary?: {
    title: string;
    message: string;
    actionURL?: string;
    tags?: string[];
  };
}
