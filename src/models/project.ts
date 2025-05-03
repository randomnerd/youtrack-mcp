import youtrackClient from '../youtrack-client';
import * as YouTrackTypes from '../types/youtrack';

export class ProjectModel {
  static async getAll(): Promise<YouTrackTypes.Project[]> {
    return youtrackClient.listProjects();
  }
} 