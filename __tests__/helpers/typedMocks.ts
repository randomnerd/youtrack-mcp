import { jest } from '@jest/globals';
import * as YouTrackTypes from '../../src/types/youtrack';

// Define extended types for testing
export interface MockIssue extends Omit<YouTrackTypes.Issue, 'status'> {
  status?: string;
  assignee?: {
    id?: string;
    name?: string;
  };
}

export interface MockSprint extends YouTrackTypes.Sprint {
  status?: string;
  startDate?: string;
  endDate?: string;
}

// Sprint model mocks
export const mockGetById = jest.fn<
  (boardId: string, sprintId: string) => Promise<YouTrackTypes.Sprint | null>
>();

export const mockGetSprintIssues = jest.fn<
  (sprintName: string) => Promise<YouTrackTypes.Issue[]>
>();

export const mockFindSprints = jest.fn<
  (options: any) => Promise<YouTrackTypes.Sprint[]>
>();

// Board model mocks
export const mockBoardGetById = jest.fn<
  (boardId: string) => Promise<YouTrackTypes.Board | null>
>();

export const mockGetAll = jest.fn<
  () => Promise<YouTrackTypes.Board[]>
>();

// Issue model mocks
export const mockIssueGetById = jest.fn<
  (issueId: string) => Promise<MockIssue | null>
>();

export const mockSearchIssues = jest.fn<
  (query: string, options?: any) => Promise<MockIssue[]>
>();

export const mockFindByCriteria = jest.fn<
  (criteria: any) => Promise<MockIssue[]>
>();

export const mockUpdateIssue = jest.fn<
  (issueId: string, updateData: any) => Promise<MockIssue>
>();

// Sprint view mocks
export const mockRenderError = jest.fn();
export const mockRenderDetail = jest.fn();
export const mockRenderList = jest.fn();
export const mockHandleResourceRequest = jest.fn();

// Project model mocks
export const mockProjectGetAll = jest.fn<
  () => Promise<YouTrackTypes.Project[]>
>();

// Re-export jest functions for convenience
export const mockImplementation = jest.fn().mockImplementation;
export const mockClear = jest.fn().mockClear;
export const mockReset = jest.fn().mockReset;
export const mockRestore = jest.fn().mockRestore; 