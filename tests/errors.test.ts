import { describe, it, expect } from 'vitest';
import { WirePusherError, WirePusherAuthError, WirePusherValidationError } from '../src/errors.js';

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
});
