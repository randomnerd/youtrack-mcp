import { McpResponse, ResourceResponse } from '../views/common';
import { ControllerResult } from '../types/controllerResults';

/**
 * Safely extracts a parameter value from request params
 * @param params Request parameters
 * @param paramName Name of the parameter to extract
 * @returns The parameter value or undefined
 */
export function extractParam(params: Record<string, string | string[] | undefined>, paramName: string): string | undefined {
  if (!params) return undefined;
  
  const param = params[paramName];
  if (typeof param === 'string') {
    return param;
  } else if (Array.isArray(param)) {
    return param[0];
  }
  return undefined;
}

/**
 * Creates a standard error response for controllers
 * @param error Error object or string
 * @param messagePrefix Optional prefix for the error message
 * @returns McpResponse with error information
 */
export function createErrorResponse(error: unknown, messagePrefix?: string): McpResponse {
  const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
  const prefix = messagePrefix ? `${messagePrefix}: ` : '';
  
  return {
    content: [{ type: 'text', text: `${prefix}${errorMessage}` }],
    isError: true
  };
}

/**
 * Creates a controller error result
 * @param error Error object or string
 * @param messagePrefix Optional prefix for the error message
 * @returns ControllerResult with error information
 */
export function createErrorResult<T>(error: unknown, messagePrefix?: string): ControllerResult<T> {
  const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
  const prefix = messagePrefix ? `${messagePrefix}: ` : '';
  
  return {
    success: false,
    error: `${prefix}${errorMessage}`
  };
}

/**
 * Creates a standard resource error response
 * @param uri The resource URI
 * @param error Error object or string
 * @returns ResourceResponse with error information
 */
export function createResourceErrorResponse(uri: URL, error: unknown): ResourceResponse {
  const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
  
  return {
    contents: [{
      uri: uri.href,
      text: `Error: ${errorMessage}`
    }]
  };
}

/**
 * Creates a standard resource response
 * @param uri The resource URI
 * @param text Response text content
 * @returns ResourceResponse with the provided content
 */
export function createResourceResponse(uri: URL, text: string): ResourceResponse {
  return {
    contents: [{
      uri: uri.href,
      text
    }]
  };
}

/**
 * Wraps controller methods with standard error handling
 * @param fn The async function to wrap
 * @param errorPrefix Optional prefix for error messages
 * @returns A function with standardized error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<ControllerResult<R>>,
  errorPrefix?: string
): (...args: T) => Promise<ControllerResult<R>> {
  return async (...args: T): Promise<ControllerResult<R>> => {
    try {
      return await fn(...args);
    } catch (error) {
      return createErrorResult<R>(error, errorPrefix);
    }
  };
}

/**
 * Wraps resource handler methods with standard error handling
 * @param fn The resource handler function to wrap
 * @returns A function with standardized error handling for resources
 */
export function withResourceErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const uri = args[0] as URL;
      return createResourceErrorResponse(uri, error) as unknown as R;
    }
  };
}

/**
 * Formats a date consistently throughout the application
 * @param date Date string, number, or Date object
 * @returns Formatted date string or 'N/A' if date is invalid
 */
export function formatDate(date: string | number | Date | null | undefined): string {
  if (date === null || date === undefined) return 'N/A';
  try {
    return new Date(date).toLocaleDateString();
  } catch (e) {
    return 'N/A';
  }
} 