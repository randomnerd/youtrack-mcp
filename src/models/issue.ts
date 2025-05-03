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
  static async getById(issueId: string): Promise<YouTrackTypes.Issue | null> {
    return youtrackClient.getIssue(issueId);
  }
  
  static async getIssueActivities(issueId: string): Promise<any[]> {
    return youtrackClient.getIssueActivities(issueId);
  }
  
  static async searchIssues(query: string, options?: SearchOptions): Promise<YouTrackTypes.Issue[]> {
    return youtrackClient.searchIssues(query, options);
  }
  
  static async findIssuesByCriteria(options: FindIssuesByCriteriaOptions): Promise<YouTrackTypes.Issue[]> {
    return youtrackClient.findIssuesByCriteria(options);
  }
  
  static async updateIssue(issueId: string, updateData: UpdateIssueOptions): Promise<any> {
    return youtrackClient.updateIssue(issueId, updateData);
  }
} 