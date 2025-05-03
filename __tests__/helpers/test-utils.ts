import { McpResponse } from '../../src/views/common';

/**
 * Typeguard to check if a response is of type McpResponse
 * @param response - The response to check
 * @returns boolean indicating if it's an McpResponse
 */
export function isMcpResponse(response: any): response is McpResponse {
  return (
    response &&
    typeof response === 'object' &&
    'metadata' in response &&
    'data' in response
  );
}

/**
 * Helper function to create a mock MCP request for testing
 * @param functionName - The MCP function name to call
 * @param params - The parameters for the function
 */
export function createMockMcpRequest(functionName: string, params: Record<string, any> = {}) {
  return {
    mcp: {
      function_name: functionName
    },
    params
  };
}

/**
 * Helper to extract error message from a rejected promise
 * @param promise - The promise that will reject
 * @returns The error message
 */
export async function getErrorMessage(promise: Promise<any>): Promise<string> {
  try {
    await promise;
    return 'No error thrown';
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/**
 * Deep clone an object to avoid reference issues in tests
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Helper function to validate that a response has the expected structure
 * @param response - The response to validate
 * @param expectedSuccess - Expected success status
 */
export function validateResponseStructure(response: any, expectedSuccess = true): void {
  expect(response).toBeDefined();
  expect(response).toHaveProperty('metadata');
  expect(response).toHaveProperty('data');
  expect(response.metadata).toHaveProperty('success', expectedSuccess);
} 