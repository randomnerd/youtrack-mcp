export interface ContentItem {
  [x: string]: unknown;
  type: 'text';
  text: string;
}

export interface McpResponse {
  [x: string]: unknown;
  content: ContentItem[];
  isError?: boolean;
  _meta?: Record<string, unknown>;
}

export interface ResourceResponse {
  [x: string]: unknown;
  contents: Array<{
    uri: string;
    text: string;
    mimeType?: string;
  } | {
    uri: string;
    blob: string;
    mimeType?: string;
  }>;
  _meta?: Record<string, unknown>;
}

export class CommonView {
  static renderEmpty(message: string): McpResponse {
    return {
      content: [{ type: 'text', text: message }]
    };
  }

  static renderError(message: string): McpResponse {
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true
    };
  }

  static renderText(text: string): McpResponse {
    return {
      content: [{ type: 'text', text }]
    };
  }

  static renderMultiple(items: string[]): McpResponse {
    return {
      content: items.map(item => ({ type: 'text' as const, text: item }))
    };
  }

  static createResourceResponse(uri: URL, text: string): ResourceResponse {
    return {
      contents: [{
        uri: uri.href,
        text
      }]
    };
  }

  /**
   * Convert an MCP response to a Resource response
   * @param uri - The resource URI
   * @param response - The MCP response to convert
   * @returns Resource response for MCP server
   */
  static mcpToResourceResponse(uri: URL, response: McpResponse): ResourceResponse {
    // Join all text content items into a single string
    const text = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n\n');

    return this.createResourceResponse(uri, text);
  }
} 