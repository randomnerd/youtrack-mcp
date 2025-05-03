import youtrackClient from '../youtrack-client';
import * as YouTrackTypes from '../types/youtrack';

export class ProjectModel {
  /**
   * Get all projects
   * @param options - Pagination options
   * @returns Array of projects
   */
  static async getAll(options?: { limit?: number; skip?: number }): Promise<YouTrackTypes.Project[]> {
    return youtrackClient.listProjects(options);
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
   * @param options - Pagination options
   * @returns Array of matching projects
   */
  static async findByName(name: string, options?: { limit?: number; skip?: number }): Promise<YouTrackTypes.Project[]> {
    try {
      // With the YouTrack API, we can't directly search by name with pagination
      // So we need to implement it in two ways:
      
      // If a more direct API is available (e.g., findProjectsByName endpoint)
      if (youtrackClient.findProjectsByName) {
        return youtrackClient.findProjectsByName(name, options);
      }
      
      // Fallback: get all and filter
      const allProjects = await this.getAll();
      
      if (!name) {
        // If no name filter, just apply pagination manually
        const skip = options?.skip || 0;
        const limit = options?.limit || allProjects.length;
        return allProjects.slice(skip, skip + limit);
      }
      
      // Filter by name
      const searchTerm = name.toLowerCase();
      const filteredProjects = allProjects.filter(project => 
        project.name.toLowerCase().includes(searchTerm) || 
        (project.shortName && project.shortName.toLowerCase().includes(searchTerm))
      );
      
      // Apply pagination to filtered results
      const skip = options?.skip || 0;
      const limit = options?.limit || filteredProjects.length;
      return filteredProjects.slice(skip, skip + limit);
    } catch (error) {
      throw new Error(`Failed to find projects by name: ${(error as Error).message}`);
    }
  }
} 