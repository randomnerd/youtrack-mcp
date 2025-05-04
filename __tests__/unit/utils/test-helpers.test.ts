import { isRetryableError, formatFileSize } from '../../../src/utils/test-helpers';

describe('test-helpers', () => {
  describe('isRetryableError', () => {
    it('should return false for non-object errors', () => {
      expect(isRetryableError('string error')).toBe(false);
      expect(isRetryableError(123)).toBe(false);
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });

    it('should return true for server errors (5XX)', () => {
      const error = { response: { status: 503 } };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for rate limiting (429)', () => {
      const error = { response: { status: 429 } };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for client errors (4XX) other than 429', () => {
      const error = { response: { status: 404 } };
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return true for specific network errors', () => {
      const networkError = { message: 'Network Error' };
      const connectionResetError = { message: 'ECONNRESET' };
      const connectionRefusedError = { message: 'ECONNREFUSED' };

      expect(isRetryableError(networkError)).toBe(true);
      expect(isRetryableError(connectionResetError)).toBe(true);
      expect(isRetryableError(connectionRefusedError)).toBe(true);
    });

    it('should return false for timeout errors without the exact match', () => {
      const timeoutError = { message: 'Request timed out' };
      expect(isRetryableError(timeoutError)).toBe(false);
    });

    it('should return true for literal timeout errors', () => {
      const timeoutError = { message: 'timeout' };
      expect(isRetryableError(timeoutError)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = { message: 'Some other error' };
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('should format 0 bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 bytes');
    });

    it('should format 1 byte correctly', () => {
      expect(formatFileSize(1)).toBe('1 byte');
    });

    it('should format bytes correctly', () => {
      expect(formatFileSize(512)).toBe('512 bytes');
      expect(formatFileSize(999)).toBe('999 bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10.0 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(5242880)).toBe('5.0 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
      expect(formatFileSize(2147483648)).toBe('2.0 GB');
    });

    it('should format terabytes correctly', () => {
      expect(formatFileSize(1099511627776)).toBe('1.0 TB');
    });
  });
}); 