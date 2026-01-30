import { describe, it, expect } from 'vitest';
import { PinchoError, PinchoAuthError, PinchoValidationError, ErrorCode } from '../src/errors.js';

describe('Error Classes', () => {
  describe('PinchoError', () => {
    it('should create error with message', () => {
      const error = new PinchoError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('PinchoError');
    });

    it('should be instance of Error', () => {
      const error = new PinchoError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PinchoError);
    });

    it('should have proper stack trace', () => {
      const error = new PinchoError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('PinchoError');
    });
  });

  describe('PinchoAuthError', () => {
    it('should create auth error with message', () => {
      const error = new PinchoAuthError('Authentication failed');
      expect(error.message).toBe('Authentication failed');
      expect(error.name).toBe('PinchoAuthError');
    });

    it('should be instance of PinchoError', () => {
      const error = new PinchoAuthError('Authentication failed');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PinchoError);
      expect(error).toBeInstanceOf(PinchoAuthError);
    });

    it('should work with instanceof checks', () => {
      const error = new PinchoAuthError('Authentication failed');
      expect(error instanceof PinchoAuthError).toBe(true);
      expect(error instanceof PinchoError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('PinchoValidationError', () => {
    it('should create validation error with message', () => {
      const error = new PinchoValidationError('Invalid parameters');
      expect(error.message).toBe('Invalid parameters');
      expect(error.name).toBe('PinchoValidationError');
    });

    it('should be instance of PinchoError', () => {
      const error = new PinchoValidationError('Invalid parameters');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PinchoError);
      expect(error).toBeInstanceOf(PinchoValidationError);
    });

    it('should work with instanceof checks', () => {
      const error = new PinchoValidationError('Invalid parameters');
      expect(error instanceof PinchoValidationError).toBe(true);
      expect(error instanceof PinchoError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('Error differentiation', () => {
    it('should differentiate between error types', () => {
      const authError = new PinchoAuthError('Auth failed');
      const validationError = new PinchoValidationError('Validation failed');
      const baseError = new PinchoError('Base error');

      // Auth error checks
      expect(authError instanceof PinchoAuthError).toBe(true);
      expect(authError instanceof PinchoValidationError).toBe(false);

      // Validation error checks
      expect(validationError instanceof PinchoValidationError).toBe(true);
      expect(validationError instanceof PinchoAuthError).toBe(false);

      // All inherit from base error
      expect(authError instanceof PinchoError).toBe(true);
      expect(validationError instanceof PinchoError).toBe(true);
      expect(baseError instanceof PinchoError).toBe(true);
    });
  });

  describe('Error codes', () => {
    it('should have default error code UNKNOWN for PinchoError', () => {
      const error = new PinchoError('Test error');
      expect(error.code).toBe(ErrorCode.UNKNOWN);
    });

    it('should accept custom error code', () => {
      const error = new PinchoError('Network error', ErrorCode.NETWORK_ERROR);
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
    });

    it('should have default error code AUTH_INVALID for PinchoAuthError', () => {
      const error = new PinchoAuthError('Auth failed');
      expect(error.code).toBe(ErrorCode.AUTH_INVALID);
    });

    it('should accept custom error code for PinchoAuthError', () => {
      const error = new PinchoAuthError('Forbidden', ErrorCode.AUTH_FORBIDDEN);
      expect(error.code).toBe(ErrorCode.AUTH_FORBIDDEN);
    });

    it('should have default error code VALIDATION_ERROR for PinchoValidationError', () => {
      const error = new PinchoValidationError('Invalid params');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should accept custom error code for PinchoValidationError', () => {
      const error = new PinchoValidationError('Not found', ErrorCode.NOT_FOUND);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
    });
  });

  describe('isRetryable property', () => {
    it('should default to false for PinchoError', () => {
      const error = new PinchoError('Test error');
      expect(error.isRetryable).toBe(false);
    });

    it('should be true when set for network errors', () => {
      const error = new PinchoError('Network error', ErrorCode.NETWORK_ERROR, true);
      expect(error.isRetryable).toBe(true);
    });

    it('should be true when set for timeout errors', () => {
      const error = new PinchoError('Timeout', ErrorCode.TIMEOUT, true);
      expect(error.isRetryable).toBe(true);
    });

    it('should be false for auth errors', () => {
      const error = new PinchoAuthError('Auth failed');
      expect(error.isRetryable).toBe(false);
    });

    it('should be false for validation errors', () => {
      const error = new PinchoValidationError('Invalid params');
      expect(error.isRetryable).toBe(false);
    });

    it('should be true when set for server errors', () => {
      const error = new PinchoError('Server error', ErrorCode.SERVER_ERROR, true);
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
