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
      content: [{ type: 'text', text: message }],
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
} 