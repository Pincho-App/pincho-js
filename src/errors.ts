/**
 * Base error class for all WirePusher SDK errors.
 */
export class WirePusherError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WirePusherError';
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
 * - The user ID is incorrect
 * - The token doesn't have permission for the user ID
 * - The account is disabled
 */
export class WirePusherAuthError extends WirePusherError {
  constructor(message: string) {
    super(message);
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
 * - The user is not found
 */
export class WirePusherValidationError extends WirePusherError {
  constructor(message: string) {
    super(message);
    this.name = 'WirePusherValidationError';
    Object.setPrototypeOf(this, WirePusherValidationError.prototype);
  }
}
