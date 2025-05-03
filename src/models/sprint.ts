import youtrackClient from '../youtrack-client';
import * as YouTrackTypes from '../types/youtrack';

interface FindSprintsOptions {
  boardId?: string;
  sprintName?: string;
  status?: 'active' | 'archived' | 'all';
  limit?: number;
}

export class SprintModel {
  static async getById(boardId: string, sprintId: string): Promise<YouTrackTypes.Sprint | null> {
    return youtrackClient.getSprint(boardId, sprintId);
  }
  
  static async findSprints(options: FindSprintsOptions): Promise<YouTrackTypes.Sprint[]> {
    return youtrackClient.findSprints(options);
  }
  
  static async getSprintIssues(sprintName: string): Promise<YouTrackTypes.Issue[]> {
    return youtrackClient.searchIssues(`sprint: {${sprintName}}`);
  }
} 