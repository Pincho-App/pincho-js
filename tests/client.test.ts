import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WirePusher } from '../src/client.js';
import { WirePusherError, WirePusherAuthError, WirePusherValidationError, ErrorCode } from '../src/errors.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('WirePusher', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('should create instance with deviceId only', () => {
      const client = new WirePusher({ deviceId: 'device123' });
      expect(client).toBeInstanceOf(WirePusher);
    });

    it('should create instance with token only', () => {
      const client = new WirePusher({ token: 'wpt_test123' });
      expect(client).toBeInstanceOf(WirePusher);
    });

    it('should throw error if both token and deviceId provided', () => {
      expect(() => {
        new WirePusher({
          token: 'wpt_test123',
          deviceId: 'device123',
        });
      }).toThrow(WirePusherValidationError);
    });

    it('should throw error if neither token nor deviceId provided', () => {
      expect(() => {
        new WirePusher({});
      }).toThrow(WirePusherValidationError);
    });

    it('should use custom timeout if provided', () => {
      const client = new WirePusher({
        deviceId: 'device123',
        timeout: 60000,
      });

      expect(client).toBeInstanceOf(WirePusher);
    });

    it('should use custom base URL if provided', () => {
      const client = new WirePusher({
        deviceId: 'device123',
        baseUrl: 'https://custom.example.com',
      });

      expect(client).toBeInstanceOf(WirePusher);
    });
  });

  describe('send', () => {
    it('should send simple notification (title, message)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Notification sent' }),
      });

      const client = new WirePusher({ deviceId: 'device123' });

      const response = await client.send('Test Title', 'Test message');

      expect(response.status).toBe('success');
      expect(response.message).toBe('Notification sent');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should send notification with options object', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Notification sent' }),
      });

      const client = new WirePusher({ deviceId: 'device123' });

      const response = await client.send({
        title: 'Test Title',
        message: 'Test message',
        type: 'alert',
        tags: ['urgent', 'production'],
        imageURL: 'https://example.com/image.png',
        actionURL: 'https://example.com/action',
      });

      expect(response.status).toBe('success');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const call = mockFetch.mock.calls[0]!;
      const body = JSON.parse(call[1]?.body as string);
      expect(body.type).toBe('alert');
      expect(body.tags).toEqual(['urgent', 'production']);
      expect(body.imageURL).toBe('https://example.com/image.png');
      expect(body.actionURL).toBe('https://example.com/action');
    });

    it('should handle 401 authentication error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status: 'error',
          error: {
            type: 'authentication_error',
            code: 'invalid_token',
            message: 'Invalid token',
          },
        }),
      });

      const client = new WirePusher({
        token: 'invalid_token',
      });

      try {
        await client.send('Test', 'Message');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(WirePusherAuthError);
        expect((error as WirePusherAuthError).code).toBe(ErrorCode.AUTH_INVALID);
        expect((error as WirePusherAuthError).isRetryable).toBe(false);
        expect((error as WirePusherAuthError).message).toContain('Invalid token or device ID');
      }
    });

    it('should handle 403 forbidden error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status: 'error',
          error: {
            type: 'authentication_error',
            code: 'forbidden',
            message: 'Account disabled',
          },
        }),
      });

      const client = new WirePusher({ deviceId: 'device123' });

      try {
        await client.send('Test', 'Message');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(WirePusherAuthError);
        expect((error as WirePusherAuthError).code).toBe(ErrorCode.AUTH_FORBIDDEN);
        expect((error as WirePusherAuthError).isRetryable).toBe(false);
        expect((error as WirePusherAuthError).message).toContain('Forbidden');
      }
    });

    it('should handle 400 validation error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status: 'error',
          error: {
            type: 'validation_error',
            code: 'invalid_parameter',
            message: 'Title is required',
            param: 'title',
          },
        }),
      });

      const client = new WirePusher({ deviceId: 'device123' });

      await expect(client.send('', 'Message')).rejects.toThrow(WirePusherValidationError);
      await expect(client.send('', 'Message')).rejects.toThrow(/Invalid parameters/);
      await expect(client.send('', 'Message')).rejects.toThrow(/parameter: title/);
      await expect(client.send('', 'Message')).rejects.toThrow(/invalid_parameter/);
    });

    it('should handle 404 not found error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status: 'error',
          error: {
            type: 'not_found_error',
            code: 'device_not_found',
            message: 'Device not found',
            param: 'id',
          },
        }),
      });

      const client = new WirePusher({
        deviceId: 'invalid_device',
      });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherValidationError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/Device not found/);
    });

    it('should handle 500 server error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status: 'error',
          error: {
            type: 'server_error',
            code: 'internal_error',
            message: 'Server error',
          },
        }),
      });

      const client = new WirePusher({ deviceId: 'device123' });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/API error \(500\)/);
    });

    it('should handle error response with text content', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Internal server error',
      });

      const client = new WirePusher({ deviceId: 'device123' });

      await expect(client.send('Test', 'Message')).rejects.toThrow(/Internal server error/);
    });

    it('should handle malformed JSON error response gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => {
          throw new Error('Invalid JSON');
        },
        text: async () => 'Malformed response',
      });

      const client = new WirePusher({ deviceId: 'device123' });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherError);
    });

    it('should parse nested error format with code and param', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status: 'error',
          error: {
            type: 'validation_error',
            code: 'invalid_length',
            message: 'Title must be between 1 and 250 characters',
            param: 'title',
          },
        }),
      });

      const client = new WirePusher({ deviceId: 'device123' });

      try {
        await client.send('', 'Message');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(WirePusherValidationError);
        const err = error as WirePusherValidationError;
        // Should include parameter context
        expect(err.message).toContain('parameter: title');
        // Should include error code
        expect(err.message).toContain('[invalid_length]');
        // Should include base message
        expect(err.message).toContain('Title must be between 1 and 250 characters');
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const client = new WirePusher({ deviceId: 'device123' });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/Network error/);
    });

    it('should handle timeout errors', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const client = new WirePusher({
        deviceId: 'device123',
        timeout: 1000,
      });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/Request timeout/);
    });

    it('should handle non-Error throws gracefully', async () => {
      mockFetch.mockRejectedValue('string error');

      const client = new WirePusher({ deviceId: 'device123' });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/Unexpected error/);
    });

    it('should only include optional parameters when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Sent' }),
      });

      const client = new WirePusher({ deviceId: 'device123' });

      await client.send({
        title: 'Test',
        message: 'Message',
        // Only title and message provided
      });

      const call = mockFetch.mock.calls[0]!;
      const body = JSON.parse(call[1]?.body as string);

      expect(body.title).toBe('Test');
      expect(body.message).toBe('Message');
      expect(body.id).toBe('device123');
      expect(body.token).toBeUndefined();
      expect(body.type).toBeUndefined();
      expect(body.tags).toBeUndefined();
      expect(body.imageURL).toBeUndefined();
      expect(body.actionURL).toBeUndefined();
    });

    it('should use correct headers and URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Sent' }),
      });

      const client = new WirePusher({ deviceId: 'device123' });

      await client.send('Test', 'Message');

      const call = mockFetch.mock.calls[0]!;
      expect(call[0]).toBe('https://wirepusher.com/send');
      expect(call[1]?.method).toBe('POST');
      expect(call[1]?.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('should use custom base URL when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Sent' }),
      });

      const client = new WirePusher({
        deviceId: 'device123',
        baseUrl: 'https://custom.example.com',
      });

      await client.send('Test', 'Message');

      const call = mockFetch.mock.calls[0]!;
      expect(call[0]).toBe('https://custom.example.com/send');
    });

    it('should encrypt message when encryptionPassword provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Sent' }),
      });

      const client = new WirePusher({ deviceId: 'device123' });

      await client.send({
        title: 'Secure Message',
        message: 'Sensitive information here',
        type: 'secure',
        encryptionPassword: 'test_password_123',
      });

      const call = mockFetch.mock.calls[0]!;
      const body = JSON.parse(call[1]?.body as string);

      // Title should NOT be encrypted
      expect(body.title).toBe('Secure Message');
      expect(body.type).toBe('secure');

      // Message should be encrypted (different from original)
      expect(body.message).not.toBe('Sensitive information here');

      // Should include IV for decryption
      expect(body.iv).toBeDefined();
      expect(typeof body.iv).toBe('string');
      expect(body.iv.length).toBe(32); // 16 bytes as hex

      // Encrypted message should not contain standard Base64 chars
      expect(body.message).not.toMatch(/[+/=]/);
    });

    it('should not encrypt when encryptionPassword not provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Sent' }),
      });

      const client = new WirePusher({ deviceId: 'device123' });

      await client.send({
        title: 'Regular Message',
        message: 'Not encrypted',
        type: 'info',
      });

      const call = mockFetch.mock.calls[0]!;
      const body = JSON.parse(call[1]?.body as string);

      // Message should NOT be encrypted
      expect(body.message).toBe('Not encrypted');

      // Should NOT include IV
      expect(body.iv).toBeUndefined();
    });

    it('should use token authentication when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Sent' }),
      });

      const client = new WirePusher({ token: 'wpt_test123' });

      await client.send('Test', 'Message');

      const call = mockFetch.mock.calls[0]!;
      const body = JSON.parse(call[1]?.body as string);

      expect(body.token).toBe('wpt_test123');
      expect(body.id).toBeUndefined();
    });

    it('should use deviceId authentication when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Sent' }),
      });

      const client = new WirePusher({ deviceId: 'device123' });

      await client.send('Test', 'Message');

      const call = mockFetch.mock.calls[0]!;
      const body = JSON.parse(call[1]?.body as string);

      expect(body.id).toBe('device123');
      expect(body.token).toBeUndefined();
    });

    it('should normalize tags before sending', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Sent' }),
      });

      const client = new WirePusher({ deviceId: 'device123' });

      await client.send({
        title: 'Test',
        message: 'Message',
        tags: ['Production', ' ALERT ', 'alert', 'test@tag', 'production'],
      });

      const call = mockFetch.mock.calls[0]!;
      const body = JSON.parse(call[1]?.body as string);

      // Tags should be normalized: lowercase, trimmed, deduplicated, invalid chars removed
      expect(body.tags).toEqual(['production', 'alert', 'testtag']);
    });

    it('should not include tags if all become invalid after normalization', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Sent' }),
      });

      const client = new WirePusher({ deviceId: 'device123' });

      await client.send({
        title: 'Test',
        message: 'Message',
        tags: ['@@@', '!!!', '###'],
      });

      const call = mockFetch.mock.calls[0]!;
      const body = JSON.parse(call[1]?.body as string);

      // All tags are invalid, so tags should not be included
      expect(body.tags).toBeUndefined();
    });

    it('should handle 500 server error as retryable', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status: 'error',
          error: {
            type: 'server_error',
            code: 'internal_error',
            message: 'Server error',
          },
        }),
      });

      const client = new WirePusher({ deviceId: 'device123' });

      try {
        await client.send('Test', 'Message');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(WirePusherError);
        expect((error as WirePusherError).code).toBe(ErrorCode.SERVER_ERROR);
        expect((error as WirePusherError).isRetryable).toBe(true);
      }
    });

    it('should handle network errors as retryable', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const client = new WirePusher({ deviceId: 'device123' });

      try {
        await client.send('Test', 'Message');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(WirePusherError);
        expect((error as WirePusherError).code).toBe(ErrorCode.NETWORK_ERROR);
        expect((error as WirePusherError).isRetryable).toBe(true);
      }
    });

    it('should handle timeout errors as retryable', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const client = new WirePusher({
        deviceId: 'device123',
        timeout: 1000,
      });

      try {
        await client.send('Test', 'Message');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(WirePusherError);
        expect((error as WirePusherError).code).toBe(ErrorCode.TIMEOUT);
        expect((error as WirePusherError).isRetryable).toBe(true);
      }
    });
  });
});
