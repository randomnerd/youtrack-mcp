import { 
  extractParam,
  createErrorResponse,
  createResourceErrorResponse,
  createResourceResponse,
  withErrorHandling,
  withResourceErrorHandling,
  formatDate
} from '../../../src/utils/controller-utils';
import { URL } from 'url';
import { McpResponse, ResourceResponse as ViewResourceResponse } from '../../../src/views/common';

// Define interfaces for response structures to avoid using 'any'
interface ErrorResponseContent {
  text: string;
}

// Type for resource error response
interface ResourceErrorResponse extends ViewResourceResponse {
  contents: Array<{
    uri: string;
    text: string;
  }>;
}

interface ResourceResponse {
  contents: {
    uri: string;
    text: string;
  }[];
}

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
      expect(extractParam(null as unknown as Record<string, string | string[] | undefined>, 'id')).toBeUndefined();
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
      
      const response = createResourceErrorResponse(uri, error) as ResourceErrorResponse;
      
      expect(response).toHaveProperty('contents');
      expect(response.contents).toHaveLength(1);
      expect(response.contents[0]).toHaveProperty('uri', uri.href);
      expect(response.contents[0].text).toContain('Error: Resource error');
    });

    it('should handle non-Error objects', () => {
      const uri = new URL('https://example.com/resource');
      const response = createResourceErrorResponse(uri, 'String error') as ResourceErrorResponse;
      
      expect(response.contents[0]).toHaveProperty('uri', uri.href);
      expect(response.contents[0].text).toContain('Error: String error');
    });
  });

  describe('createResourceResponse', () => {
    it('should create a resource response with text content', () => {
      const uri = new URL('https://example.com/resource');
      const text = 'Resource content';
      
      const response = createResourceResponse(uri, text) as ResourceResponse;
      
      expect(response).toHaveProperty('contents');
      expect(response.contents).toHaveLength(1);
      expect(response.contents[0]).toHaveProperty('uri', uri.href);
      expect(response.contents[0].text).toBe(text);
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
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error', 'Test prefix: Function error');
      expect(JSON.stringify(result)).toContain('Test prefix: Function error');
    });
  });

  describe('withResourceErrorHandling', () => {
    it('should return function result when no error occurs', async () => {
      const uri = new URL('https://example.com/resource');
      const expectedResponse = { contents: [{ uri: uri.href, text: 'Success' }] };
      const mockFn = jest.fn().mockResolvedValue(expectedResponse);
      const wrappedFn = withResourceErrorHandling(mockFn);
      
      const result = await wrappedFn(uri, 'arg2');
      
      expect(mockFn).toHaveBeenCalledWith(uri, 'arg2');
      expect(result).toEqual(expectedResponse);
    });

    it('should return error response when error occurs', async () => {
      const uri = new URL('https://example.com/resource');
      const error = new Error('Resource error');
      const mockFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = withResourceErrorHandling(mockFn);
      
      const result = await wrappedFn(uri) as ResourceErrorResponse;
      
      expect(mockFn).toHaveBeenCalledWith(uri);
      expect(result.contents[0].uri).toBe(uri.href);
      expect(result.contents[0].text).toContain('Error: Resource error');
    });
  });

  describe('formatDate', () => {
    beforeEach(() => {
      // Mock toLocaleDateString to return a consistent format for testing
      const originalToLocaleDateString = Date.prototype.toLocaleDateString;
      Date.prototype.toLocaleDateString = function() {
        return this.toISOString().split('T')[0];
      };
      
      return () => {
        Date.prototype.toLocaleDateString = originalToLocaleDateString;
      };
    });
    
    it('should format valid date strings', () => {
      const date = '2023-07-15T12:30:45Z';
      expect(formatDate(date)).toBe('2023-07-15');
    });
    
    it('should format Date objects', () => {
      const date = new Date('2023-07-15T12:30:45Z');
      expect(formatDate(date)).toBe('2023-07-15');
    });
    
    it('should format timestamps', () => {
      const timestamp = new Date('2023-07-15T12:30:45Z').getTime();
      expect(formatDate(timestamp)).toBe('2023-07-15');
    });
    
    it('should return N/A for null values', () => {
      expect(formatDate(null)).toBe('N/A');
    });
    
    it('should return N/A for undefined values', () => {
      expect(formatDate(undefined)).toBe('N/A');
    });
    
    it('should return N/A for invalid date strings', () => {
      expect(formatDate('not-a-date')).toBe('N/A');
    });
  });
}); 