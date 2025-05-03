import youtrackClient from '../youtrack-client';
import * as YouTrackTypes from '../types/youtrack';

interface SearchOptions {
  limit?: number;
  skip?: number;
  sortBy?: string;
}

interface FindIssuesByCriteriaOptions {
  project?: string;
  assignee?: string;
  sprint?: string;
  type?: string;
  status?: string;
  limit?: number;
  skip?: number;
}

interface UpdateIssueOptions {
  summary?: string;
  description?: string;
  resolved?: boolean;
}

interface GetIssueActivitiesOptions {
  limit?: number;
  skip?: number;
  categories?: string;
  reverse?: boolean;
}

interface GetIssueCommentsOptions {
  limit?: number;
  skip?: number;
}

interface GetIssueAttachmentsOptions {
  limit?: number;
  skip?: number;
}

interface GetIssueLinksOptions {
  limit?: number;
  skip?: number;
}

export class IssueModel {
  static async getById(issueId: string): Promise<YouTrackTypes.IssueWithActivities | null> {
    return youtrackClient.getIssue(issueId);
  }
  
  static async getIssueActivities(
    issueId: string, 
    options?: GetIssueActivitiesOptions
  ): Promise<YouTrackTypes.Activity[]> {
    const { limit, skip, categories, reverse } = options || {};
    return await youtrackClient.getIssueActivities(issueId, { 
      top: limit, 
      skip, 
      categories,
      reverse
    });
  }
  
  static async getIssueComments(
    issueId: string,
    options?: GetIssueCommentsOptions
  ): Promise<YouTrackTypes.IssueComment[]> {
    return youtrackClient.getIssueComments(issueId, options);
  }
  
  static async getIssueAttachments(
    issueId: string,
    options?: GetIssueAttachmentsOptions
  ): Promise<YouTrackTypes.IssueAttachment[]> {
    return youtrackClient.getIssueAttachments(issueId, options);
  }
  
  static async getIssueLinks(
    issueId: string,
    options?: GetIssueLinksOptions
  ): Promise<YouTrackTypes.IssueLink[]> {
    return youtrackClient.getIssueLinks(issueId, options);
  }
  
  static async searchIssues(
    query: string, 
    options?: SearchOptions
  ): Promise<YouTrackTypes.IssueWithActivities[]> {
    return youtrackClient.searchIssues(query, options);
  }
  
  static async findIssuesByCriteria(
    options: FindIssuesByCriteriaOptions
  ): Promise<YouTrackTypes.IssueWithActivities[]> {
    return youtrackClient.findIssuesByCriteria(options);
  }
  
  static async updateIssue(
    issueId: string, 
    updateData: UpdateIssueOptions
  ): Promise<YouTrackTypes.IssueWithActivities> {
    return youtrackClient.updateIssue(issueId, updateData);
  }
} 