/**
 * WirePusher Client Library for JavaScript and TypeScript.
 *
 * Official SDK for WirePusher push notifications API.
 *
 * @packageDocumentation
 */

export { WirePusher } from './client.js';
export { WirePusherError, WirePusherAuthError, WirePusherValidationError, ErrorCode } from './errors.js';
export type { ClientConfig, NotificationOptions, NotificationResponse, NotifAIResponse } from './types.js';
export { normalizeTags } from './utils.js';
