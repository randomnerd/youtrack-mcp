import youtrackClient from '../youtrack-client';
import * as YouTrackTypes from '../types/youtrack';

interface FindSprintsOptions {
  boardId?: string;
  sprintName?: string;
  status?: 'active' | 'archived' | 'all';
  limit?: number;
  skip?: number;
}

interface SprintIssuesOptions {
  limit?: number;
  skip?: number;
  sortBy?: string;
}

export class SprintModel {
  static async getById(boardId: string, sprintId: string): Promise<YouTrackTypes.Sprint | null> {
    return youtrackClient.getSprint(boardId, sprintId);
  }
  
  static async findSprints(options: FindSprintsOptions): Promise<YouTrackTypes.Sprint[]> {
    const sprints = await youtrackClient.findSprints(options);
    
    // Add status property to each sprint based on its isCompleted/archived properties
    const enhancedSprints = sprints.map(sprint => ({
      ...sprint,
      status: sprint.archived ? 'archived' : (sprint.isCompleted ? 'completed' : 'active')
    }));
    
    // Filter sprints by name if sprintName is provided
    let filteredSprints = enhancedSprints;
    if (options.sprintName) {
      filteredSprints = enhancedSprints.filter(sprint => 
        sprint.name.toLowerCase().includes(options.sprintName?.toLowerCase() || '')
      );
    }
    
    return filteredSprints;
  }
  
  static async getSprintIssues(
    sprintName: string, 
    options?: SprintIssuesOptions
  ): Promise<YouTrackTypes.Issue[]> {
    return youtrackClient.searchIssues(`sprint: {${sprintName}}`, options);
  }
} 