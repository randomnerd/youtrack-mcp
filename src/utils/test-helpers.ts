// This file contains functions that need test coverage
// It directly imports and re-exports private functions from the actual implementation files
// This is only used for testing purposes and will not be included in the production build

import { YouTrack } from './youtrack';

// YouTrack helper exports
export function isRetryableError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  // Check for specific HTTP status codes
  if ('response' in error && error.response && typeof error.response === 'object') {
    const response = error.response as { status?: number };
    const status = response.status;

    // Retry on server errors (5XX) and rate limiting (429)
    if (status && (status === 429 || (status >= 500 && status < 600))) {
      return true;
    }
  }

  // Check for network errors
  if ('message' in error && typeof error.message === 'string') {
    const message = error.message as string;
    if (
      message.includes('Network Error') ||
      message.includes('timeout') ||
      message.includes('ECONNRESET') ||
      message.includes('ECONNREFUSED')
    ) {
      return true;
    }
  }

  return false;
}

export function calculateRetryDelay(retryCount: number): number {
  // Exponential backoff algorithm
  const baseDelay = 100;
  const maxDelay = 30000; // 30 seconds max
  const jitter = Math.random() * 0.5 + 0.5; // 0.5 to 1.0 jitter factor

  // Calculate delay: baseDelay * 2^retryCount * jitter
  const delay = baseDelay * Math.pow(2, retryCount) * jitter;

  // Ensure delay is within bounds
  return Math.min(Math.max(baseDelay, delay), maxDelay);
}

// Issue formatter helper exports
export function stripMarkdown(text: string): string {
  if (!text) {
    return text;
  }

  return text
    // Remove headings
    .replace(/^#+ (.+)$/gm, '$1')
    // Remove bold
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // Remove italic
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, (match) => match.split('```')[1].trim())
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove links
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove block quotes
    .replace(/^> (.+)$/gm, '$1')
    // Remove lists
    .replace(/^[\*\-] (.+)$/gm, '$1')
    .replace(/^\d+\. (.+)$/gm, '$1');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 bytes';
  if (bytes === 1) return '1 byte';
  if (bytes < 1024) return `${bytes} bytes`;
  
  const k = 1024;
  const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
} 