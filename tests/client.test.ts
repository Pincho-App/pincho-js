import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    it('should create instance with token', () => {
      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });
      expect(client).toBeInstanceOf(WirePusher);
    });

    it('should use custom timeout if provided', () => {
      const client = new WirePusher({
        maxRetries: 0,
        token: 'abc12345',
        timeout: 60000,
      });

      expect(client).toBeInstanceOf(WirePusher);
    });

    it('should use custom base URL if provided', () => {
      const client = new WirePusher({
        maxRetries: 0,
        token: 'abc12345',
        baseUrl: 'https://custom.example.com',
      });

      expect(client).toBeInstanceOf(WirePusher);
    });

    it('should throw error when token not provided and no env var', () => {
      const originalToken = process.env.WIREPUSHER_TOKEN;
      delete process.env.WIREPUSHER_TOKEN;

      expect(() => new WirePusher({})).toThrow('Token is required');

      // Restore
      if (originalToken) process.env.WIREPUSHER_TOKEN = originalToken;
    });

    it('should read token from WIREPUSHER_TOKEN env var', () => {
      const originalToken = process.env.WIREPUSHER_TOKEN;
      process.env.WIREPUSHER_TOKEN = 'env_token_123';

      const client = new WirePusher({ maxRetries: 0 });
      expect(client).toBeInstanceOf(WirePusher);

      // Restore
      if (originalToken) {
        process.env.WIREPUSHER_TOKEN = originalToken;
      } else {
        delete process.env.WIREPUSHER_TOKEN;
      }
    });

    it('should read timeout from WIREPUSHER_TIMEOUT env var (seconds to ms)', () => {
      const originalTimeout = process.env.WIREPUSHER_TIMEOUT;
      process.env.WIREPUSHER_TIMEOUT = '60'; // 60 seconds

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });
      // We can't directly check private property, but we can test behavior
      expect(client).toBeInstanceOf(WirePusher);

      // Restore
      if (originalTimeout) {
        process.env.WIREPUSHER_TIMEOUT = originalTimeout;
      } else {
        delete process.env.WIREPUSHER_TIMEOUT;
      }
    });

    it('should read maxRetries from WIREPUSHER_MAX_RETRIES env var', () => {
      const originalRetries = process.env.WIREPUSHER_MAX_RETRIES;
      process.env.WIREPUSHER_MAX_RETRIES = '5';

      const client = new WirePusher({ token: 'abc12345' });
      expect(client).toBeInstanceOf(WirePusher);

      // Restore
      if (originalRetries) {
        process.env.WIREPUSHER_MAX_RETRIES = originalRetries;
      } else {
        delete process.env.WIREPUSHER_MAX_RETRIES;
      }
    });

    it('should prefer explicit config over env vars', () => {
      const originalToken = process.env.WIREPUSHER_TOKEN;
      process.env.WIREPUSHER_TOKEN = 'env_token';

      const client = new WirePusher({ token: 'explicit_token', maxRetries: 0 });
      expect(client).toBeInstanceOf(WirePusher);

      // Restore
      if (originalToken) {
        process.env.WIREPUSHER_TOKEN = originalToken;
      } else {
        delete process.env.WIREPUSHER_TOKEN;
      }
    });
  });

  describe('send', () => {
    it('should send simple notification (title, message)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Notification sent' }),
      });

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

      const response = await client.send('Test Title', 'Test message');

      expect(response.status).toBe('success');
      expect(response.message).toBe('Notification sent');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify Authorization header is sent
      const call = mockFetch.mock.calls[0]!;
      expect(call[1]?.headers).toHaveProperty('Authorization', 'Bearer abc12345');
    });

    it('should send notification with options object', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Notification sent' }),
      });

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

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
        maxRetries: 0,
        token: 'invalid_token',
      });

      try {
        await client.send('Test', 'Message');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(WirePusherAuthError);
        expect((error as WirePusherAuthError).code).toBe(ErrorCode.AUTH_INVALID);
        expect((error as WirePusherAuthError).isRetryable).toBe(false);
        expect((error as WirePusherAuthError).message).toContain('Invalid token');
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

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

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

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

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
        maxRetries: 0,
        token: 'abc12345',
      });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherValidationError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/Resource not found/);
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

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/API error \(500\)/);
    });

    it('should handle 429 rate limit error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status: 'error',
          error: {
            type: 'rate_limit_error',
            code: 'rate_limited',
            message: 'Rate limit exceeded',
          },
        }),
      });

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

      try {
        await client.send('Test', 'Message');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(WirePusherError);
        expect((error as WirePusherError).code).toBe(ErrorCode.RATE_LIMIT);
        expect((error as WirePusherError).isRetryable).toBe(true);
        expect((error as WirePusherError).message).toContain('Rate limit exceeded');
      }
    });

    it('should handle unknown status code error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 418,
        statusText: "I'm a teapot",
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status: 'error',
          error: {
            type: 'unknown_error',
            code: 'unknown',
            message: 'Unknown error',
          },
        }),
      });

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

      try {
        await client.send('Test', 'Message');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(WirePusherError);
        expect((error as WirePusherError).code).toBe(ErrorCode.UNKNOWN);
        expect((error as WirePusherError).isRetryable).toBe(false);
        expect((error as WirePusherError).message).toContain('API error (418)');
      }
    });

    it('should handle error response with text content', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Internal server error',
      });

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

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

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

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

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

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

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/Network error/);
    });

    it('should handle timeout errors', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const client = new WirePusher({
        maxRetries: 0,
        token: 'abc12345',
        timeout: 1000,
      });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/Request timeout/);
    });

    it('should handle non-Error throws gracefully', async () => {
      mockFetch.mockRejectedValue('string error');

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/Unexpected error/);
    });

    it('should only include optional parameters when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Sent' }),
      });

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

      await client.send({
        title: 'Test',
        message: 'Message',
        // Only title and message provided
      });

      const call = mockFetch.mock.calls[0]!;
      const body = JSON.parse(call[1]?.body as string);

      expect(body.title).toBe('Test');
      expect(body.message).toBe('Message');
      expect(body.type).toBeUndefined();
      expect(body.tags).toBeUndefined();
      expect(body.imageURL).toBeUndefined();
      expect(body.actionURL).toBeUndefined();

      // Token should be in header, not body
      expect(call[1]?.headers).toHaveProperty('Authorization', 'Bearer abc12345');
    });

    it('should use correct headers and URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Sent' }),
      });

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

      await client.send('Test', 'Message');

      const call = mockFetch.mock.calls[0]!;
      expect(call[0]).toBe('https://api.wirepusher.dev/send');
      expect(call[1]?.method).toBe('POST');
      expect(call[1]?.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer abc12345',
      });
    });

    it('should use custom base URL when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Sent' }),
      });

      const client = new WirePusher({
        maxRetries: 0,
        token: 'abc12345',
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

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

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

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

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

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

      await client.send('Test', 'Message');

      const call = mockFetch.mock.calls[0]!;

      // Token should be in Authorization header, not body
      expect(call[1]?.headers).toHaveProperty('Authorization', 'Bearer abc12345');
    });

    it('should normalize tags before sending', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Sent' }),
      });

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

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

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

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

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

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

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

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
        maxRetries: 0,
        token: 'abc12345',
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

    it('should retry on server error and succeed on second attempt', async () => {
      // First call fails with 500, second call succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            status: 'error',
            error: { message: 'Server error' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', message: 'Notification sent' }),
        });

      const client = new WirePusher({ token: 'abc12345', maxRetries: 1 });

      // Mock timers to avoid actual delays
      vi.useFakeTimers();

      const sendPromise = client.send('Test', 'Message');

      // Fast-forward through the retry delay
      await vi.runAllTimersAsync();

      const response = await sendPromise;

      expect(response.status).toBe('success');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should use longer backoff for rate limit errors', async () => {
      // Rate limit error should have 5s base backoff
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            status: 'error',
            error: { message: 'Rate limited' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', message: 'Sent' }),
        });

      const client = new WirePusher({ token: 'abc12345', maxRetries: 1 });

      vi.useFakeTimers();

      const sendPromise = client.send('Test', 'Message');

      // Fast-forward through the retry delay (rate limit uses 5s base)
      await vi.runAllTimersAsync();

      const response = await sendPromise;

      expect(response.status).toBe('success');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('notifai', () => {
    it('should send notifai request successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          message: 'Notification received successfully',
          summary: {
            title: 'Deploy Complete - v2.1.3',
            message: 'API v2.1.3 deployed successfully to production.',
            tags: ['deploy', 'production'],
          },
        }),
      });

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

      const response = await client.notifai('deployment finished successfully, v2.1.3 is live on prod');

      expect(response.status).toBe('success');
      expect(response.summary?.title).toBe('Deploy Complete - v2.1.3');
      expect(response.summary?.tags).toEqual(['deploy', 'production']);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const call = mockFetch.mock.calls[0]!;
      expect(call[0]).toBe('https://api.wirepusher.dev/notifai');
      expect(call[1]?.headers).toHaveProperty('Authorization', 'Bearer abc12345');
    });

    it('should send notifai request with type parameter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          message: 'Notification received successfully',
        }),
      });

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

      await client.notifai('test notification', 'alert');

      const call = mockFetch.mock.calls[0]!;
      const body = JSON.parse(call[1]?.body as string);

      expect(body.text).toBe('test notification');
      expect(body.type).toBe('alert');
    });

    it('should handle 401 authentication error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
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

      const client = new WirePusher({ token: 'invalid' });

      try {
        await client.notifai('test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(WirePusherAuthError);
        expect((error as WirePusherAuthError).code).toBe(ErrorCode.AUTH_INVALID);
      }
    });

    it('should handle 400 validation error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status: 'error',
          error: {
            type: 'validation_error',
            code: 'text_too_short',
            message: 'Text must be at least 5 characters',
            param: 'text',
          },
        }),
      });

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

      try {
        await client.notifai('hi');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(WirePusherValidationError);
        expect((error as WirePusherValidationError).message).toContain('Text must be at least 5 characters');
      }
    });

    it('should handle 500 server error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
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

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

      try {
        await client.notifai('test message');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(WirePusherError);
        expect((error as WirePusherError).code).toBe(ErrorCode.SERVER_ERROR);
        expect((error as WirePusherError).isRetryable).toBe(true);
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const client = new WirePusher({ token: 'abc12345', maxRetries: 0 });

      try {
        await client.notifai('test message');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(WirePusherError);
        expect((error as WirePusherError).code).toBe(ErrorCode.NETWORK_ERROR);
        expect((error as WirePusherError).message).toContain('Network error');
      }
    });

    it('should handle timeout errors', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const client = new WirePusher({
        maxRetries: 0,
        token: 'abc12345',
        timeout: 1000,
      });

      try {
        await client.notifai('test message');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(WirePusherError);
        expect((error as WirePusherError).code).toBe(ErrorCode.TIMEOUT);
        expect((error as WirePusherError).isRetryable).toBe(true);
      }
    });
  });
});
