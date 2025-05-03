import youtrackClient from '../youtrack-client';
import * as YouTrackTypes from '../types/youtrack';

export class ProjectModel {
  /**
   * Get all projects
   * @returns Array of projects
   */
  static async getAll(): Promise<YouTrackTypes.Project[]> {
    return youtrackClient.listProjects();
  }

  /**
   * Get a project by ID
   * @param projectId - The ID of the project
   * @returns The project or null if not found
   */
  static async getById(projectId: string): Promise<YouTrackTypes.Project | null> {
    try {
      const projects = await this.getAll();
      const project = projects.find(p => p.id === projectId);
      return project || null;
    } catch (error) {
      throw new Error(`Failed to get project by ID: ${(error as Error).message}`);
    }
  }

  /**
   * Find projects by name
   * @param name - Partial name to search for
   * @returns Array of matching projects
   */
  static async findByName(name: string): Promise<YouTrackTypes.Project[]> {
    try {
      const projects = await this.getAll();
      
      if (!name) return projects;
      
      const searchTerm = name.toLowerCase();
      return projects.filter(project => 
        project.name.toLowerCase().includes(searchTerm) || 
        (project.shortName && project.shortName.toLowerCase().includes(searchTerm))
      );
    } catch (error) {
      throw new Error(`Failed to find projects by name: ${(error as Error).message}`);
    }
  }
} 