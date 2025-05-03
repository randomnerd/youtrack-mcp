import { ProjectModel } from '../models/project';
import { ProjectView } from '../views/projectView';
import { McpResponse } from '../views/common';

export class ProjectController {
  static async listProjects(): Promise<McpResponse> {
    try {
      const projects = await ProjectModel.getAll();
      return ProjectView.renderList(projects);
    } catch (error) {
      return ProjectView.renderError(`Error fetching projects: ${(error as Error).message}`);
    }
  }
} 