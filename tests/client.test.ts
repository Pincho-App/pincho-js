import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WirePusher } from '../src/client.js';
import { WirePusherError, WirePusherAuthError, WirePusherValidationError } from '../src/errors.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('WirePusher', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'user123',
      });

      expect(client).toBeInstanceOf(WirePusher);
    });

    it('should throw error if token is missing', () => {
      expect(() => {
        new WirePusher({
          token: '',
          userId: 'user123',
        });
      }).toThrow(WirePusherValidationError);
    });

    it('should throw error if userId is missing', () => {
      expect(() => {
        new WirePusher({
          token: 'wpt_test123',
          userId: '',
        });
      }).toThrow(WirePusherValidationError);
    });

    it('should use custom timeout if provided', () => {
      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'user123',
        timeout: 60000,
      });

      expect(client).toBeInstanceOf(WirePusher);
    });

    it('should use custom base URL if provided', () => {
      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'user123',
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

      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'user123',
      });

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

      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'user123',
      });

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
        json: async () => ({ message: 'Invalid token' }),
      });

      const client = new WirePusher({
        token: 'invalid_token',
        userId: 'user123',
      });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherAuthError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/Invalid token or user ID/);
    });

    it('should handle 403 forbidden error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Account disabled' }),
      });

      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'user123',
      });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherAuthError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/Forbidden/);
    });

    it('should handle 400 validation error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Title is required' }),
        text: async () => 'Title is required',
      });

      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'user123',
      });

      await expect(client.send('', 'Message')).rejects.toThrow(WirePusherValidationError);
      await expect(client.send('', 'Message')).rejects.toThrow(/Invalid parameters/);
    });

    it('should handle 404 not found error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'User not found' }),
      });

      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'invalid_user',
      });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherValidationError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/User not found/);
    });

    it('should handle 500 server error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Server error' }),
      });

      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'user123',
      });

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

      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'user123',
      });

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

      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'user123',
      });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'user123',
      });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/Network error/);
    });

    it('should handle timeout errors', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'user123',
        timeout: 1000,
      });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/Request timeout/);
    });

    it('should handle non-Error throws gracefully', async () => {
      mockFetch.mockRejectedValue('string error');

      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'user123',
      });

      await expect(client.send('Test', 'Message')).rejects.toThrow(WirePusherError);
      await expect(client.send('Test', 'Message')).rejects.toThrow(/Unexpected error/);
    });

    it('should only include optional parameters when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', message: 'Sent' }),
      });

      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'user123',
      });

      await client.send({
        title: 'Test',
        message: 'Message',
        // Only title and message provided
      });

      const call = mockFetch.mock.calls[0]!;
      const body = JSON.parse(call[1]?.body as string);

      expect(body.title).toBe('Test');
      expect(body.message).toBe('Message');
      expect(body.id).toBe('user123');
      expect(body.token).toBe('wpt_test123');
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

      const client = new WirePusher({
        token: 'wpt_test123',
        userId: 'user123',
      });

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
        token: 'wpt_test123',
        userId: 'user123',
        baseUrl: 'https://custom.example.com',
      });

      await client.send('Test', 'Message');

      const call = mockFetch.mock.calls[0]!;
      expect(call[0]).toBe('https://custom.example.com/send');
    });
  });
});
