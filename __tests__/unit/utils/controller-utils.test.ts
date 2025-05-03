import { 
  extractParam,
  createErrorResponse,
  createResourceErrorResponse,
  createResourceResponse,
  withErrorHandling,
  withResourceErrorHandling,
  formatDate
} from '../../../src/utils/controller-utils';

describe('Controller Utilities', () => {
  describe('extractParam', () => {
    it('should extract string parameter', () => {
      const params = { id: '123' };
      expect(extractParam(params, 'id')).toBe('123');
    });

    it('should extract first item from array parameter', () => {
      const params = { id: ['123', '456'] };
      expect(extractParam(params, 'id')).toBe('123');
    });

    it('should return undefined for missing parameter', () => {
      const params = { id: '123' };
      expect(extractParam(params, 'nonexistent')).toBeUndefined();
    });

    it('should return undefined for null params', () => {
      expect(extractParam(null, 'id')).toBeUndefined();
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response from Error object', () => {
      const error = new Error('Test error');
      const response = createErrorResponse(error);
      
      expect(response).toHaveProperty('isError', true);
      expect(response).toHaveProperty('content');
      expect(response.content[0]).toHaveProperty('text', 'Test error');
    });

    it('should create error response with prefix', () => {
      const error = new Error('Test error');
      const response = createErrorResponse(error, 'Failed');
      
      expect(response).toHaveProperty('isError', true);
      expect(response.content[0]).toHaveProperty('text', 'Failed: Test error');
    });

    it('should handle non-Error objects', () => {
      const response = createErrorResponse('Plain string error');
      
      expect(response).toHaveProperty('isError', true);
      expect(response.content[0]).toHaveProperty('text', 'Plain string error');
    });

    it('should handle undefined error with default message', () => {
      const response = createErrorResponse(undefined);
      
      expect(response).toHaveProperty('isError', true);
      expect(response.content[0]).toHaveProperty('text', 'Unknown error');
    });
  });

  describe('createResourceErrorResponse', () => {
    it('should create a resource error response', () => {
      const uri = new URL('https://example.com/resource');
      const error = new Error('Resource error');
      
      const response = createResourceErrorResponse(uri, error);
      
      expect(response).toHaveProperty('contents');
      expect(response.contents).toHaveLength(1);
      expect(response.contents[0]).toHaveProperty('uri', uri.href);
      expect((response.contents[0] as any).text).toContain('Error: Resource error');
    });

    it('should handle non-Error objects', () => {
      const uri = new URL('https://example.com/resource');
      const response = createResourceErrorResponse(uri, 'String error');
      
      expect(response.contents[0]).toHaveProperty('uri', uri.href);
      expect((response.contents[0] as any).text).toContain('Error: String error');
    });
  });

  describe('createResourceResponse', () => {
    it('should create a resource response with text content', () => {
      const uri = new URL('https://example.com/resource');
      const text = 'Resource content';
      
      const response = createResourceResponse(uri, text);
      
      expect(response).toHaveProperty('contents');
      expect(response.contents).toHaveLength(1);
      expect(response.contents[0]).toHaveProperty('uri', uri.href);
      expect((response.contents[0] as any).text).toBe(text);
    });
  });

  describe('withErrorHandling', () => {
    it('should return function result when no error occurs', async () => {
      const mockFn = jest.fn().mockResolvedValue({ success: true });
      const wrappedFn = withErrorHandling(mockFn, 'Test prefix');
      
      const result = await wrappedFn('arg1', 'arg2');
      
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toEqual({ success: true });
    });

    it('should return error response when error occurs', async () => {
      const error = new Error('Function error');
      const mockFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = withErrorHandling(mockFn, 'Test prefix');
      
      const result = await wrappedFn('arg1');
      
      expect(mockFn).toHaveBeenCalledWith('arg1');
      expect(result).toHaveProperty('isError', true);
      expect(JSON.stringify(result)).toContain('Test prefix: Function error');
    });
  });

  describe('withResourceErrorHandling', () => {
    it('should return function result when no error occurs', async () => {
      const mockFn = jest.fn().mockResolvedValue({ success: true });
      const wrappedFn = withResourceErrorHandling(mockFn);
      
      const result = await wrappedFn('arg1', 'arg2');
      
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toEqual({ success: true });
    });

    it('should return resource error response when error occurs', async () => {
      const uri = new URL('https://example.com/resource');
      const error = new Error('Resource function error');
      const mockFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = withResourceErrorHandling(mockFn);
      
      const result = await wrappedFn(uri, 'arg2');
      
      expect(mockFn).toHaveBeenCalledWith(uri, 'arg2');
      expect(result).toHaveProperty('contents');
      expect((result as any).contents[0]).toHaveProperty('uri', uri.href);
      expect(JSON.stringify(result)).toContain('Resource function error');
    });
  });

  describe('formatDate', () => {
    it('should format a valid date', () => {
      const date = new Date('2023-05-15');
      const formatted = formatDate(date);
      
      // The format depends on locale, but we can check it's not N/A
      expect(formatted).not.toBe('N/A');
      expect(formatted).toContain('2023');
    });

    it('should return N/A for null date', () => {
      expect(formatDate(null)).toBe('N/A');
    });

    it('should return N/A for undefined date', () => {
      expect(formatDate(undefined)).toBe('N/A');
    });

    it('should handle invalid date and return Invalid Date', () => {
      expect(formatDate('not-a-date')).toBe('Invalid Date');
    });
  });
}); 