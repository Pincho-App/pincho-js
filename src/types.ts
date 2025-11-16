/**
 * Configuration options for the WirePusher client.
 */
export interface ClientConfig {
  /**
   * WirePusher token for authentication.
   * If not provided, reads from WIREPUSHER_TOKEN environment variable.
   * @example 'abc12345'
   */
  token?: string;

  /**
   * Request timeout in milliseconds.
   * If not provided, reads from WIREPUSHER_TIMEOUT env var (in seconds) or defaults to 30000ms.
   * @default 30000
   */
  timeout?: number;

  /**
   * Maximum number of retry attempts for transient errors.
   * If not provided, reads from WIREPUSHER_MAX_RETRIES env var or defaults to 3.
   * Set to 0 to disable retries.
   * @default 3
   */
  maxRetries?: number;

  /**
   * Custom base URL (mainly for testing).
   * @default 'https://api.wirepusher.dev'
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
   * AI-generated notification summary (deprecated, use notification).
   */
  summary?: {
    title: string;
    message: string;
    actionURL?: string;
    tags?: string[];
  };

  /**
   * AI-generated notification details.
   */
  notification?: {
    title: string;
    message: string;
    type: string;
    actionURL?: string | null;
    tags?: string[];
  };
}
