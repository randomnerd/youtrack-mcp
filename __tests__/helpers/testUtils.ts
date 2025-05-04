import { ControllerResult } from '../../src/types/controllerResults';

/**
 * Creates a controller result object for testing
 * @param data The data to include in the result
 * @param success Whether the operation was successful (defaults to true)
 * @param error Optional error message if success is false
 * @returns A controller result object
 */
export function createControllerResult<T>(
  data: T | undefined, 
  success = true, 
  error?: string
): ControllerResult<T> {
  return {
    success,
    data,
    error
  };
}

/**
 * Creates a mock request object for testing
 * @param params Request parameters
 * @returns A mock request object
 */
export function createMockRequest<T>(params: T) {
  return {
    parameters: params
  };
}

/**
 * Wait for a specified time
 * @param ms Milliseconds to wait
 * @returns Promise that resolves after the specified time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates a random string for testing
 * @param length Length of the string to generate (default: 8)
 * @returns Random string
 */
export function generateRandomString(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
} 