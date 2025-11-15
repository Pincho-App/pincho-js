/**
 * Error codes for WirePusher API errors.
 */
export enum ErrorCode {
  /** Generic/unknown error */
  UNKNOWN = 'UNKNOWN',
  /** Network-related errors */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** Request timeout */
  TIMEOUT = 'TIMEOUT',
  /** Authentication failed (invalid token) */
  AUTH_INVALID = 'AUTH_INVALID',
  /** Permission denied (forbidden) */
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',
  /** Validation error (invalid parameters) */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** Resource not found */
  NOT_FOUND = 'NOT_FOUND',
  /** Server error (5xx responses) */
  SERVER_ERROR = 'SERVER_ERROR',
}

/**
 * Base error class for all WirePusher Client Library errors.
 */
export class WirePusherError extends Error {
  /**
   * Machine-readable error code.
   */
  public readonly code: ErrorCode;

  /**
   * Whether the error is retryable (e.g., network errors, timeouts).
   */
  public readonly isRetryable: boolean;

  constructor(message: string, code: ErrorCode = ErrorCode.UNKNOWN, isRetryable = false) {
    super(message);
    this.name = 'WirePusherError';
    this.code = code;
    this.isRetryable = isRetryable;
    // Maintains proper stack trace for where the error was thrown
    Error.captureStackTrace(this, this.constructor);
    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, WirePusherError.prototype);
  }
}

/**
 * Error thrown when authentication fails.
 *
 * This typically occurs when:
 * - The API token is invalid or expired
 * - The account is disabled
 */
export class WirePusherAuthError extends WirePusherError {
  constructor(message: string, code: ErrorCode = ErrorCode.AUTH_INVALID, isRetryable = false) {
    super(message, code, isRetryable);
    this.name = 'WirePusherAuthError';
    Object.setPrototypeOf(this, WirePusherAuthError.prototype);
  }
}

/**
 * Error thrown when request validation fails.
 *
 * This typically occurs when:
 * - Required parameters are missing
 * - Parameters have invalid values
 * - The request format is incorrect
 */
export class WirePusherValidationError extends WirePusherError {
  constructor(message: string, code: ErrorCode = ErrorCode.VALIDATION_ERROR, isRetryable = false) {
    super(message, code, isRetryable);
    this.name = 'WirePusherValidationError';
    Object.setPrototypeOf(this, WirePusherValidationError.prototype);
  }
}
