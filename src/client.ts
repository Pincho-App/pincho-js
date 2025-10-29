import type { ClientConfig, NotificationOptions, NotificationResponse } from './types.js';
import { WirePusherError, WirePusherAuthError, WirePusherValidationError } from './errors.js';
import { encryptMessage, generateIV } from './crypto.js';

/**
 * WirePusher client for sending push notifications via the v1 API.
 *
 * This client supports both team tokens (for team-wide notifications) and user IDs
 * (for personal notifications). Token and userId are mutually exclusive.
 *
 * @deprecated userId parameter - Legacy authentication. Use token parameter instead.
 *
 * @example
 * ```typescript
 * import { WirePusher } from 'wirepusher';
 *
 * // Team notifications
 * const teamClient = new WirePusher({ token: 'wpt_your_token' });
 * await teamClient.send('Team Alert', 'Server maintenance scheduled');
 *
 * // Personal notifications (deprecated - use token instead)
 * const userClient = new WirePusher({ userId: 'your_user_id' });
 * await userClient.send('Personal Alert', 'Your task is due soon');
 *
 * // With all options including encryption
 * await userClient.send({
 *   title: 'Secure Message',
 *   message: 'Sensitive information here',
 *   type: 'secure',
 *   tags: ['confidential'],
 *   encryptionPassword: 'your_password'
 * });
 * ```
 */
export class WirePusher {
  private readonly baseUrl: string;
  private readonly token: string | undefined;
  private readonly userId: string | undefined;
  private readonly timeout: number;

  constructor(config: ClientConfig) {
    // Validate mutual exclusivity
    if (config.token && config.userId) {
      throw new WirePusherValidationError(
        "Cannot specify both 'token' and 'userId' - they are mutually exclusive. " +
          "Use 'token' for team notifications or 'userId' for personal notifications.",
      );
    }
    if (!config.token && !config.userId) {
      throw new WirePusherValidationError(
        "Must specify either 'token' or 'userId'. " +
          "Use 'token' for team notifications or 'userId' for personal notifications.",
      );
    }

    this.token = config.token;
    this.userId = config.userId;
    this.timeout = config.timeout ?? 30000;
    this.baseUrl = config.baseUrl ?? 'https://wirepusher.com';
  }

  /**
   * Send a notification via WirePusher v1 API.
   *
   * Supports two signatures:
   * 1. `send(title, message)` - Simple notification
   * 2. `send(options)` - Full notification with all parameters
   *
   * @param titleOrOptions - Notification title or options object
   * @param message - Notification message (only when using simple signature)
   * @returns Promise resolving to the API response
   * @throws {WirePusherAuthError} Invalid token or user ID
   * @throws {WirePusherValidationError} Invalid parameters
   * @throws {WirePusherError} Network errors or other API errors
   *
   * @example
   * ```typescript
   * // Simple signature
   * await client.send('Title', 'Message');
   *
   * // Full signature
   * await client.send({
   *   title: 'Title',
   *   message: 'Message',
   *   type: 'alert',
   *   tags: ['urgent'],
   *   imageURL: 'https://example.com/img.png'
   * });
   *
   * // With encryption
   * await client.send({
   *   title: 'Secure Message',
   *   message: 'Sensitive data',
   *   type: 'secure',
   *   encryptionPassword: 'your_password'
   * });
   * ```
   */
  async send(
    titleOrOptions: string | NotificationOptions,
    message?: string,
  ): Promise<NotificationResponse> {
    // Support both signatures: send(title, message) and send(options)
    const options: NotificationOptions =
      typeof titleOrOptions === 'string'
        ? { title: titleOrOptions, message: message as string }
        : titleOrOptions;

    // Handle encryption if password provided
    let finalMessage = options.message;
    let ivHex: string | undefined;

    if (options.encryptionPassword) {
      const [ivBytes, ivHexString] = generateIV();
      finalMessage = encryptMessage(options.message, options.encryptionPassword, ivBytes);
      ivHex = ivHexString;
    }

    // Build request body
    const body: {
      title: string;
      message: string;
      id?: string;
      token?: string;
      type?: string;
      tags?: string[];
      imageURL?: string;
      actionURL?: string;
      iv?: string;
    } = {
      title: options.title,
      message: finalMessage,
    };

    // Add authentication (either token or userId)
    if (this.token) body.token = this.token;
    if (this.userId) body.id = this.userId;

    // Add optional parameters only if provided
    if (options.type !== undefined) body.type = options.type;
    if (options.tags !== undefined) body.tags = options.tags;
    if (options.imageURL !== undefined) body.imageURL = options.imageURL;
    if (options.actionURL !== undefined) body.actionURL = options.actionURL;
    if (ivHex !== undefined) body.iv = ivHex;

    try {
      // Use AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle error responses
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Parse successful response
      const data = (await response.json()) as NotificationResponse;
      return data;
    } catch (error) {
      // Re-throw WirePusher errors as-is
      if (error instanceof WirePusherError) {
        throw error;
      }

      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new WirePusherError(`Request timeout after ${this.timeout}ms`);
      }

      // Handle other network errors
      if (error instanceof Error) {
        throw new WirePusherError(`Network error: ${error.message}`);
      }

      // Fallback for unknown errors
      throw new WirePusherError(`Unexpected error: ${String(error)}`);
    }
  }

  /**
   * Handle error responses from the API with graceful parsing.
   *
   * @param response - The fetch Response object
   * @throws {WirePusherAuthError} For 401/403 errors
   * @throws {WirePusherValidationError} For 400/404 errors
   * @throws {WirePusherError} For other errors
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    // Try to parse error message from response
    let errorMessage: string;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = (await response.json()) as { message?: string };
        errorMessage = errorData.message ?? response.statusText;
      } else {
        errorMessage = await response.text();
      }
    } catch {
      // Fallback if parsing fails
      errorMessage = response.statusText || 'Unknown error';
    }

    // Throw appropriate error based on status code
    switch (response.status) {
      case 401:
        throw new WirePusherAuthError(
          'Invalid token or user ID. Please check your credentials.',
        );
      case 403:
        throw new WirePusherAuthError(
          "Forbidden: Your account may be disabled or you don't have permission.",
        );
      case 400:
        throw new WirePusherValidationError(`Invalid parameters: ${errorMessage}`);
      case 404:
        throw new WirePusherValidationError('User not found. Please check your user ID.');
      default:
        throw new WirePusherError(`API error (${response.status}): ${errorMessage}`);
    }
  }
}
