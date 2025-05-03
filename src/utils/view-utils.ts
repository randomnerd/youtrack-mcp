import * as YouTrackTypes from '../types/youtrack';
import { formatDate } from './controller-utils';

/**
 * Formats a sprint period consistently
 * @param sprint The sprint object
 * @returns Formatted period string
 */
export function formatSprintPeriod(sprint: YouTrackTypes.Sprint): string {
  return `${formatDate(sprint.start)} - ${formatDate(sprint.finish)}`;
}

/**
 * Formats a board's projects as a string
 * @param board The board object
 * @returns Formatted projects string
 */
export function formatBoardProjects(board: YouTrackTypes.Board): string {
  if (!board.projects) return 'None';
  return board.projects.length > 0 ? board.projects.map(p => p.name).join(', ') : '';
}

/**
 * Formats sprint information as a list item
 * @param sprint The sprint object
 * @returns Formatted sprint string
 */
export function formatSprintListItem(sprint: YouTrackTypes.Sprint): string {
  return `ID: ${sprint.id}\nName: ${sprint.name}\nPeriod: ${formatSprintPeriod(sprint)}`;
}

/**
 * Formats sprint information as a detail line
 * @param sprint The sprint object
 * @returns Formatted sprint string for board details
 */
export function formatSprintDetailItem(sprint: YouTrackTypes.Sprint): string {
  return `  - ${sprint.name} (ID: ${sprint.id})\n    Period: ${formatSprintPeriod(sprint)}`;
}

/**
 * Formats board information as a list item
 * @param board The board object
 * @returns Formatted board string
 */
export function formatBoardListItem(board: YouTrackTypes.Board): string {
  return `ID: ${board.id}\nName: ${board.name}\nProjects: ${formatBoardProjects(board)}`;
}

/**
 * Formats issue status (resolved/open)
 * @param issue The issue object (either full Issue or IssueRef)
 * @returns Status string
 */
export function formatIssueStatus(issue: YouTrackTypes.Issue | YouTrackTypes.IssueRef): string {
  // Check if the issue has a 'resolved' property (only full Issue objects have this)
  return 'resolved' in issue && issue.resolved ? 'Resolved' : 'Open';
}

/**
 * Creates a separator of specified length
 * @param length Length of the separator
 * @returns Separator string
 */
export function createSeparator(length: number = 50): string {
  return '-'.repeat(length);
} 