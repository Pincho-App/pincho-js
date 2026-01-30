/**
 * Pincho Client Library for JavaScript and TypeScript.
 *
 * Official SDK for Pincho push notifications API.
 *
 * @packageDocumentation
 */

export { Pincho } from './client.js';
export { PinchoError, PinchoAuthError, PinchoValidationError, ErrorCode } from './errors.js';
export type {
  ClientConfig,
  NotificationOptions,
  NotificationResponse,
  NotifAIResponse,
  RateLimitInfo,
} from './types.js';
export { normalizeTags } from './utils.js';
