import { ProjectModel } from '../models/project';
import { ProjectView } from '../views/projectView';
import { McpResponse, CommonView, ResourceResponse } from '../views/common';
import { URL } from 'url';

export class ProjectController {
  /**
   * Handle incoming MCP resource requests
   * @param uri - The requested URI
   * @param req - The request object
   * @returns ResourceResponse for MCP server
   */
  static async handleResourceRequest(uri: URL, req: any): Promise<ResourceResponse> {
    try {
      const projectId = uri.pathname.split('/').pop();
      let response: McpResponse;
      
      // If a specific project is requested
      if (projectId && projectId !== 'projects') {
        response = await this.getProject(projectId);
      } else {
        // Otherwise list all projects
        response = await this.listProjects();
      }
      
      return CommonView.mcpToResourceResponse(uri, response);
    } catch (error) {
      const errorResponse = ProjectView.renderError(`Error handling project request: ${(error as Error).message}`);
      return CommonView.mcpToResourceResponse(uri, errorResponse);
    }
  }

  /**
   * List all available projects
   * @returns MCP response with project list
   */
  static async listProjects(): Promise<McpResponse> {
    try {
      const projects = await ProjectModel.getAll();
      return ProjectView.renderList(projects);
    } catch (error) {
      return ProjectView.renderError(`Error fetching projects: ${(error as Error).message}`);
    }
  }

  /**
   * Get a specific project by ID
   * @param projectId - ID of the project to retrieve
   * @returns MCP response with project details
   */
  static async getProject(projectId: string): Promise<McpResponse> {
    try {
      const project = await ProjectModel.getById(projectId);
      
      if (!project) {
        return ProjectView.renderEmpty(`No project found with ID: ${projectId}`);
      }
      
      return ProjectView.renderDetail(project);
    } catch (error) {
      return ProjectView.renderError(`Error fetching project: ${(error as Error).message}`);
    }
  }

  /**
   * Find projects by name
   * @param name - Name to search for
   * @returns MCP response with matching projects
   */
  static async findProjectsByName(name: string): Promise<McpResponse> {
    try {
      const projects = await ProjectModel.findByName(name);
      
      if (projects.length === 0) {
        return ProjectView.renderEmpty(`No projects found matching: ${name}`);
      }
      
      return ProjectView.renderList(projects);
    } catch (error) {
      return ProjectView.renderError(`Error searching projects: ${(error as Error).message}`);
    }
  }
} 