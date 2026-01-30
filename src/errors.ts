/**
 * Error codes for Pincho API errors.
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
  /** Rate limit exceeded (429) */
  RATE_LIMIT = 'RATE_LIMIT',
  /** Server error (5xx responses) */
  SERVER_ERROR = 'SERVER_ERROR',
}

/**
 * Base error class for all Pincho Client Library errors.
 */
export class PinchoError extends Error {
  /**
   * Machine-readable error code.
   */
  public readonly code: ErrorCode;

  /**
   * Whether the error is retryable (e.g., network errors, timeouts).
   */
  public readonly isRetryable: boolean;

  /**
   * Retry-After value in seconds from API response header (if available).
   * Used for rate limit errors to indicate when to retry.
   */
  public retryAfterSeconds?: number;

  constructor(message: string, code: ErrorCode = ErrorCode.UNKNOWN, isRetryable = false) {
    super(message);
    this.name = 'PinchoError';
    this.code = code;
    this.isRetryable = isRetryable;
    // Maintains proper stack trace for where the error was thrown
    Error.captureStackTrace(this, this.constructor);
    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, PinchoError.prototype);
  }
}

/**
 * Error thrown when authentication fails.
 *
 * This typically occurs when:
 * - The API token is invalid or expired
 * - The account is disabled
 */
export class PinchoAuthError extends PinchoError {
  constructor(message: string, code: ErrorCode = ErrorCode.AUTH_INVALID, isRetryable = false) {
    super(message, code, isRetryable);
    this.name = 'PinchoAuthError';
    Object.setPrototypeOf(this, PinchoAuthError.prototype);
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
export class PinchoValidationError extends PinchoError {
  constructor(message: string, code: ErrorCode = ErrorCode.VALIDATION_ERROR, isRetryable = false) {
    super(message, code, isRetryable);
    this.name = 'PinchoValidationError';
    Object.setPrototypeOf(this, PinchoValidationError.prototype);
  }
}
