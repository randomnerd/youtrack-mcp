import * as YouTrackTypes from './youtrack';

// Common result interface for all controllers
export interface ControllerResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Request type for controller handlers
export interface Request {
  params: Record<string, string>;
  query?: Record<string, string | string[]>;
  body?: Record<string, unknown>;
  method?: string;
  headers?: Record<string, string>;
}

// Issue Controller Result Types
export interface IssueDetailResult {
  issue: YouTrackTypes.IssueWithActivities;
  activities?: YouTrackTypes.Activity[];
}

export interface IssueListResult {
  issues: YouTrackTypes.Issue[];
  total: number;
  query?: string;
  title?: string;
}

export interface IssueUpdateResult {
  issueId: string;
  updated: boolean;
}

// Project Controller Result Types
export interface ProjectDetailResult {
  project: YouTrackTypes.Project;
}

export interface ProjectListResult {
  projects: YouTrackTypes.Project[];
  total: number;
}

// Sprint Controller Result Types
export interface SprintDetailResult {
  sprint: YouTrackTypes.Sprint;
  boardId: string;
}

export interface SprintListResult {
  sprints: YouTrackTypes.Sprint[];
  total: number;
}

// Board Controller Result Types
export interface BoardDetailResult {
  board: YouTrackTypes.Board;
  columns?: YouTrackTypes.AgileColumn[];
  issues?: YouTrackTypes.Issue[];
}

export interface BoardListResult {
  boards: YouTrackTypes.Board[];
  total: number;
} 