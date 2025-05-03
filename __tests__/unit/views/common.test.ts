import { CommonView, McpResponse, ContentItem } from '../../../src/views/common';
import { URL } from 'url';

// Define a custom interface to represent non-standard content items for testing
interface OtherContentItem {
  type: string;
  content: string;
}

describe('CommonView', () => {
  describe('renderEmpty', () => {
    it('should render an empty message', () => {
      const message = 'No data found';
      
      const result = CommonView.renderEmpty(message);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe(message);
    });
  });

  describe('renderError', () => {
    it('should render an error message', () => {
      const errorMessage = 'Something went wrong';
      
      const result = CommonView.renderError(errorMessage);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe(`Error: ${errorMessage}`);
      expect(result.isError).toBe(true);
    });
  });

  describe('renderText', () => {
    it('should render a text message', () => {
      const text = 'Some information';
      
      const result = CommonView.renderText(text);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe(text);
    });
  });

  describe('renderMultiple', () => {
    it('should render multiple text items', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      
      const result = CommonView.renderMultiple(items);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(3);
      items.forEach((item, index) => {
        expect(result.content[index].type).toBe('text');
        expect(result.content[index].text).toBe(item);
      });
    });

    it('should handle empty array', () => {
      const result = CommonView.renderMultiple([]);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(0);
    });
  });

  describe('createResourceResponse', () => {
    it('should create a resource response with text content', () => {
      const uri = new URL('http://example.com/resource');
      const text = 'Resource content';
      
      const result = CommonView.createResourceResponse(uri, text);
      
      expect(result).toHaveProperty('contents');
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]).toHaveProperty('uri', uri.href);
      expect(result.contents[0]).toHaveProperty('text', text);
    });
  });

  describe('mcpToResourceResponse', () => {
    it('should convert MCP response to resource response', () => {
      const uri = new URL('http://example.com/resource');
      const mcpResponse: McpResponse = {
        content: [
          { type: 'text', text: 'Line 1' },
          { type: 'text', text: 'Line 2' }
        ]
      };
      
      const result = CommonView.mcpToResourceResponse(uri, mcpResponse);
      
      expect(result).toHaveProperty('contents');
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]).toHaveProperty('uri', uri.href);
      expect(result.contents[0]).toHaveProperty('text', 'Line 1\n\nLine 2');
    });

    it('should handle MCP response with no text content', () => {
      const uri = new URL('http://example.com/resource');
      const mcpResponse: McpResponse = {
        content: []
      };
      
      const result = CommonView.mcpToResourceResponse(uri, mcpResponse);
      
      expect(result).toHaveProperty('contents');
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]).toHaveProperty('uri', uri.href);
      expect(result.contents[0]).toHaveProperty('text', '');
    });

    it('should filter out non-text content types', () => {
      const uri = new URL('http://example.com/resource');
      const mcpResponse: McpResponse = {
        content: [
          { type: 'text', text: 'Text content' } as ContentItem,
          { type: 'other', content: 'Other content' } as unknown as ContentItem
        ]
      };
      
      const result = CommonView.mcpToResourceResponse(uri, mcpResponse);
      
      expect(result).toHaveProperty('contents');
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]).toHaveProperty('uri', uri.href);
      expect(result.contents[0]).toHaveProperty('text', 'Text content');
    });
  });
}); 