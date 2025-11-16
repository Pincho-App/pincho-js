import type { ClientConfig, NotificationOptions, NotificationResponse, NotifAIResponse } from './types.js';
import { WirePusherError, WirePusherAuthError, WirePusherValidationError, ErrorCode } from './errors.js';
import { encryptMessage, generateIV } from './crypto.js';
import { normalizeTags } from './utils.js';

/**
 * WirePusher client for sending push notifications.
 *
 * @example
 * ```typescript
 * import { WirePusher } from 'wirepusher';
 *
 * // Initialize client
 * const client = new WirePusher({ token: 'abc12345' });
 * await client.send('Deploy Complete', 'Version 1.2.3 deployed');
 *
 * // With all options including encryption
 * await client.send({
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
  private readonly token: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  // Retry constants
  private static readonly INITIAL_BACKOFF_MS = 1000;
  private static readonly MAX_BACKOFF_MS = 30000;
  private static readonly RATE_LIMIT_BACKOFF_MS = 5000;

  constructor(config: ClientConfig = {}) {
    // Load from environment variables with fallbacks
    const resolvedToken = config.token || process.env.WIREPUSHER_TOKEN;
    if (!resolvedToken) {
      throw new Error(
        'Token is required. Provide token in config or set WIREPUSHER_TOKEN environment variable.',
      );
    }

    // Parse timeout from env var if not provided
    let resolvedTimeout: number;
    if (config.timeout !== undefined) {
      resolvedTimeout = config.timeout;
    } else if (process.env.WIREPUSHER_TIMEOUT) {
      resolvedTimeout = parseInt(process.env.WIREPUSHER_TIMEOUT, 10) * 1000; // Convert seconds to ms
    } else {
      resolvedTimeout = 30000;
    }

    // Parse maxRetries from env var if not provided
    let resolvedMaxRetries: number;
    if (config.maxRetries !== undefined) {
      resolvedMaxRetries = config.maxRetries;
    } else if (process.env.WIREPUSHER_MAX_RETRIES) {
      resolvedMaxRetries = parseInt(process.env.WIREPUSHER_MAX_RETRIES, 10);
    } else {
      resolvedMaxRetries = 3;
    }

    this.token = resolvedToken;
    this.timeout = resolvedTimeout;
    this.maxRetries = resolvedMaxRetries;
    this.baseUrl = config.baseUrl ?? 'https://api.wirepusher.dev';
  }

  /**
   * Calculate exponential backoff delay.
   *
   * @param attempt - Current retry attempt (0-indexed)
   * @param isRateLimit - Whether the error is a rate limit (429)
   * @returns Delay in milliseconds
   */
  private calculateBackoff(attempt: number, isRateLimit = false): number {
    const baseDelay = isRateLimit
      ? WirePusher.RATE_LIMIT_BACKOFF_MS
      : WirePusher.INITIAL_BACKOFF_MS;
    const delay = baseDelay * Math.pow(2, attempt);
    return Math.min(delay, WirePusher.MAX_BACKOFF_MS);
  }

  /**
   * Sleep for a specified number of milliseconds.
   *
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Send a notification via WirePusher API.
   *
   * Supports two signatures:
   * 1. `send(title, message)` - Simple notification
   * 2. `send(options)` - Full notification with all parameters
   *
   * @param titleOrOptions - Notification title or options object
   * @param message - Notification message (only when using simple signature)
   * @returns Promise resolving to the API response
   * @throws {WirePusherAuthError} Invalid token
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

    // Normalize tags if provided
    const normalizedTags = options.tags ? normalizeTags(options.tags) : undefined;

    // Build request body (token goes in Authorization header, not body)
    const body: {
      title: string;
      message: string;
      type?: string;
      tags?: string[];
      imageURL?: string;
      actionURL?: string;
      iv?: string;
    } = {
      title: options.title,
      message: finalMessage,
    };

    // Add optional parameters only if provided
    if (options.type !== undefined) body.type = options.type;
    if (normalizedTags !== undefined && normalizedTags.length > 0) body.tags = normalizedTags;
    if (options.imageURL !== undefined) body.imageURL = options.imageURL;
    if (options.actionURL !== undefined) body.actionURL = options.actionURL;
    if (ivHex !== undefined) body.iv = ivHex;

    // Execute with retry logic
    return this.executeWithRetry(() => this.sendRequest('/send', body)) as Promise<NotificationResponse>;
  }

  /**
   * Execute a request with retry logic for transient errors.
   *
   * @param requestFn - Function that executes the request
   * @returns Promise resolving to the response
   * @throws {WirePusherError} When all retries are exhausted
   */
  private async executeWithRetry<T>(requestFn: () => Promise<T>): Promise<T> {
    let lastError: WirePusherError | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (!(error instanceof WirePusherError)) {
          throw error;
        }

        lastError = error;

        // Don't retry if error is not retryable or we've exhausted retries
        if (!error.isRetryable || attempt === this.maxRetries) {
          throw error;
        }

        // Calculate backoff delay (special handling for rate limits)
        const isRateLimit = error.code === ErrorCode.RATE_LIMIT;
        const delay = this.calculateBackoff(attempt, isRateLimit);

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError ?? new WirePusherError('Unknown error', ErrorCode.UNKNOWN, false);
  }

  /**
   * Execute an HTTP request to the WirePusher API.
   *
   * @param endpoint - API endpoint (e.g., '/send', '/notifai')
   * @param body - Request body
   * @returns Promise resolving to the parsed JSON response
   */
  private async sendRequest(endpoint: string, body: Record<string, unknown>): Promise<unknown> {
    try {
      // Use AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
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
      return await response.json();
    } catch (error) {
      // Re-throw WirePusher errors as-is
      if (error instanceof WirePusherError) {
        throw error;
      }

      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new WirePusherError(`Request timeout after ${this.timeout}ms`, ErrorCode.TIMEOUT, true);
      }

      // Handle other network errors
      if (error instanceof Error) {
        throw new WirePusherError(`Network error: ${error.message}`, ErrorCode.NETWORK_ERROR, true);
      }

      // Fallback for unknown errors
      throw new WirePusherError(`Unexpected error: ${String(error)}`, ErrorCode.UNKNOWN, false);
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
        const errorData = (await response.json()) as {
          message?: string;
          error?: {
            type?: string;
            code?: string;
            message?: string;
            param?: string;
          };
        };

        // Parse nested error format: { error: { message, code, type, param } }
        const errorObj = errorData.error || {};
        errorMessage = errorObj.message || 'Unknown error';

        // Append parameter context if available
        if (errorObj.param) {
          errorMessage = `${errorMessage} (parameter: ${errorObj.param})`;
        }

        // Append error code if available
        if (errorObj.code) {
          errorMessage = `${errorMessage} [${errorObj.code}]`;
        }
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
          'Invalid token. Please check your credentials.',
          ErrorCode.AUTH_INVALID,
          false,
        );
      case 403:
        throw new WirePusherAuthError(
          "Forbidden: Your account may be disabled or you don't have permission.",
          ErrorCode.AUTH_FORBIDDEN,
          false,
        );
      case 400:
        throw new WirePusherValidationError(
          `Invalid parameters: ${errorMessage}`,
          ErrorCode.VALIDATION_ERROR,
          false,
        );
      case 404:
        throw new WirePusherValidationError(
          `Resource not found: ${errorMessage}`,
          ErrorCode.NOT_FOUND,
          false,
        );
      case 429:
        // Rate limit errors are retryable
        throw new WirePusherError(
          `Rate limit exceeded: ${errorMessage}`,
          ErrorCode.RATE_LIMIT,
          true,
        );
      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors are retryable
        throw new WirePusherError(
          `API error (${response.status}): ${errorMessage}`,
          ErrorCode.SERVER_ERROR,
          true,
        );
      default:
        throw new WirePusherError(
          `API error (${response.status}): ${errorMessage}`,
          ErrorCode.UNKNOWN,
          false,
        );
    }
  }

  /**
   * Convert free-form text into a structured notification using AI.
   *
   * @param text - Free-form text to convert (5-2500 characters)
   * @param type - Optional notification type to override AI-generated type
   * @returns Promise resolving to the NotifAI API response
   * @throws {WirePusherAuthError} Invalid token
   * @throws {WirePusherValidationError} Invalid parameters
   * @throws {WirePusherError} Other API errors
   *
   * @example
   * ```typescript
   * const client = new WirePusher({ token: 'abc12345' });
   * const response = await client.notifai('deployment finished, v2.1.3 is live');
   * console.log(response.summary?.title); // AI-generated title
   * ```
   */
  async notifai(text: string, type?: string): Promise<NotifAIResponse> {
    // Build request body
    const body: {
      text: string;
      type?: string;
    } = { text };

    if (type !== undefined) body.type = type;

    // Execute with retry logic
    return this.executeWithRetry(() => this.sendRequest('/notifai', body)) as Promise<NotifAIResponse>;
  }
}
