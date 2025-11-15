import { describe, it, expect } from 'vitest';
import { WirePusherError, WirePusherAuthError, WirePusherValidationError, ErrorCode } from '../src/errors.js';

describe('Error Classes', () => {
  describe('WirePusherError', () => {
    it('should create error with message', () => {
      const error = new WirePusherError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('WirePusherError');
    });

    it('should be instance of Error', () => {
      const error = new WirePusherError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(WirePusherError);
    });

    it('should have proper stack trace', () => {
      const error = new WirePusherError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('WirePusherError');
    });
  });

  describe('WirePusherAuthError', () => {
    it('should create auth error with message', () => {
      const error = new WirePusherAuthError('Authentication failed');
      expect(error.message).toBe('Authentication failed');
      expect(error.name).toBe('WirePusherAuthError');
    });

    it('should be instance of WirePusherError', () => {
      const error = new WirePusherAuthError('Authentication failed');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(WirePusherError);
      expect(error).toBeInstanceOf(WirePusherAuthError);
    });

    it('should work with instanceof checks', () => {
      const error = new WirePusherAuthError('Authentication failed');
      expect(error instanceof WirePusherAuthError).toBe(true);
      expect(error instanceof WirePusherError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('WirePusherValidationError', () => {
    it('should create validation error with message', () => {
      const error = new WirePusherValidationError('Invalid parameters');
      expect(error.message).toBe('Invalid parameters');
      expect(error.name).toBe('WirePusherValidationError');
    });

    it('should be instance of WirePusherError', () => {
      const error = new WirePusherValidationError('Invalid parameters');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(WirePusherError);
      expect(error).toBeInstanceOf(WirePusherValidationError);
    });

    it('should work with instanceof checks', () => {
      const error = new WirePusherValidationError('Invalid parameters');
      expect(error instanceof WirePusherValidationError).toBe(true);
      expect(error instanceof WirePusherError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('Error differentiation', () => {
    it('should differentiate between error types', () => {
      const authError = new WirePusherAuthError('Auth failed');
      const validationError = new WirePusherValidationError('Validation failed');
      const baseError = new WirePusherError('Base error');

      // Auth error checks
      expect(authError instanceof WirePusherAuthError).toBe(true);
      expect(authError instanceof WirePusherValidationError).toBe(false);

      // Validation error checks
      expect(validationError instanceof WirePusherValidationError).toBe(true);
      expect(validationError instanceof WirePusherAuthError).toBe(false);

      // All inherit from base error
      expect(authError instanceof WirePusherError).toBe(true);
      expect(validationError instanceof WirePusherError).toBe(true);
      expect(baseError instanceof WirePusherError).toBe(true);
    });
  });

  describe('Error codes', () => {
    it('should have default error code UNKNOWN for WirePusherError', () => {
      const error = new WirePusherError('Test error');
      expect(error.code).toBe(ErrorCode.UNKNOWN);
    });

    it('should accept custom error code', () => {
      const error = new WirePusherError('Network error', ErrorCode.NETWORK_ERROR);
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
    });

    it('should have default error code AUTH_INVALID for WirePusherAuthError', () => {
      const error = new WirePusherAuthError('Auth failed');
      expect(error.code).toBe(ErrorCode.AUTH_INVALID);
    });

    it('should accept custom error code for WirePusherAuthError', () => {
      const error = new WirePusherAuthError('Forbidden', ErrorCode.AUTH_FORBIDDEN);
      expect(error.code).toBe(ErrorCode.AUTH_FORBIDDEN);
    });

    it('should have default error code VALIDATION_ERROR for WirePusherValidationError', () => {
      const error = new WirePusherValidationError('Invalid params');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should accept custom error code for WirePusherValidationError', () => {
      const error = new WirePusherValidationError('Not found', ErrorCode.NOT_FOUND);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
    });
  });

  describe('isRetryable property', () => {
    it('should default to false for WirePusherError', () => {
      const error = new WirePusherError('Test error');
      expect(error.isRetryable).toBe(false);
    });

    it('should be true when set for network errors', () => {
      const error = new WirePusherError('Network error', ErrorCode.NETWORK_ERROR, true);
      expect(error.isRetryable).toBe(true);
    });

    it('should be true when set for timeout errors', () => {
      const error = new WirePusherError('Timeout', ErrorCode.TIMEOUT, true);
      expect(error.isRetryable).toBe(true);
    });

    it('should be false for auth errors', () => {
      const error = new WirePusherAuthError('Auth failed');
      expect(error.isRetryable).toBe(false);
    });

    it('should be false for validation errors', () => {
      const error = new WirePusherValidationError('Invalid params');
      expect(error.isRetryable).toBe(false);
    });

    it('should be true when set for server errors', () => {
      const error = new WirePusherError('Server error', ErrorCode.SERVER_ERROR, true);
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('ErrorCode enum', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCode.UNKNOWN).toBe('UNKNOWN');
      expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ErrorCode.TIMEOUT).toBe('TIMEOUT');
      expect(ErrorCode.AUTH_INVALID).toBe('AUTH_INVALID');
      expect(ErrorCode.AUTH_FORBIDDEN).toBe('AUTH_FORBIDDEN');
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCode.SERVER_ERROR).toBe('SERVER_ERROR');
    });
  });
});
