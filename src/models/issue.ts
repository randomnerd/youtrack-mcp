import youtrackClient from '../youtrack-client';
import * as YouTrackTypes from '../types/youtrack';

interface SearchOptions {
  limit?: number;
  sortBy?: string;
}

interface FindIssuesByCriteriaOptions {
  project?: string;
  assignee?: string;
  sprint?: string;
  type?: string;
  status?: string;
  limit?: number;
}

interface UpdateIssueOptions {
  summary?: string;
  description?: string;
  resolved?: boolean;
}

export class IssueModel {
  static async getById(issueId: string): Promise<YouTrackTypes.IssueWithActivities | null> {
    return youtrackClient.getIssue(issueId);
  }
  
  static async getIssueActivities(issueId: string): Promise<YouTrackTypes.Activity[]> {
    return await youtrackClient.getIssueActivities(issueId);
  }
  
  static async searchIssues(query: string, options?: SearchOptions): Promise<YouTrackTypes.IssueWithActivities[]> {
    return youtrackClient.searchIssues(query, options);
  }
  
  static async findIssuesByCriteria(options: FindIssuesByCriteriaOptions): Promise<YouTrackTypes.IssueWithActivities[]> {
    return youtrackClient.findIssuesByCriteria(options);
  }
  
  static async updateIssue(issueId: string, updateData: UpdateIssueOptions): Promise<YouTrackTypes.IssueWithActivities> {
    return youtrackClient.updateIssue(issueId, updateData);
  }
} 