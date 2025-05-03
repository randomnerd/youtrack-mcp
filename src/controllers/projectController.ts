import { ProjectModel } from '../models/project';
import { McpResponse, CommonView, ResourceResponse } from '../views/common';
import { URL } from 'url';
import { ControllerResult, ProjectDetailResult, ProjectListResult, Request } from '../types/controllerResults';
import { withErrorHandling } from '../utils/controller-utils';

export class ProjectController {
  /**
   * Handle incoming MCP resource requests
   * @param uri - The requested URI
   * @param req - The request object
   * @returns ResourceResponse for MCP server
   */
  static async handleResourceRequest(uri: URL, req: Request): Promise<ResourceResponse> {
    try {
      const projectId = uri.pathname.split('/').pop();
      
      // If a specific project is requested
      if (projectId && projectId !== 'projects') {
        const projectResult = await this.getProject(projectId);
        if (projectResult.success && projectResult.data) {
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify((projectResult.data as ProjectDetailResult).project, null, 2)
            }]
          };
        } else {
          return {
            contents: [{
              uri: uri.href,
              text: `Error: ${projectResult.error || 'Project not found'}`
            }]
          };
        }
      } else {
        // Otherwise list all projects
        const projectsResult = await this.listProjects();
        if (projectsResult.success && projectsResult.data) {
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify((projectsResult.data as ProjectListResult).projects, null, 2)
            }]
          };
        } else {
          return {
            contents: [{
              uri: uri.href,
              text: `Error: ${projectsResult.error || 'Failed to fetch projects'}`
            }]
          };
        }
      }
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error handling project request: ${(error as Error).message}`
        }]
      };
    }
  }

  /**
   * List all available projects
   * @returns Controller result with project list
   */
  static listProjects = withErrorHandling(
    async (): Promise<ControllerResult<ProjectListResult>> => {
      const projects = await ProjectModel.getAll();
      
      return {
        success: true,
        data: {
          projects,
          total: projects.length
        }
      };
    },
    'Error fetching projects'
  );

  /**
   * Get a specific project by ID
   * @param projectId - ID of the project to retrieve
   * @returns Controller result with project details
   */
  static getProject = withErrorHandling(
    async (projectId: string): Promise<ControllerResult<ProjectDetailResult>> => {
      const project = await ProjectModel.getById(projectId);
      
      if (!project) {
        return {
          success: false,
          error: `No project found with ID: ${projectId}`
        };
      }
      
      return {
        success: true,
        data: {
          project
        }
      };
    },
    'Error fetching project'
  );

  /**
   * Find projects by name
   * @param name - Name to search for
   * @returns Controller result with matching projects
   */
  static findProjectsByName = withErrorHandling(
    async (name: string): Promise<ControllerResult<ProjectListResult>> => {
      const projects = await ProjectModel.findByName(name);
      
      return {
        success: true,
        data: {
          projects,
          total: projects.length
        }
      };
    },
    'Error searching projects'
  );
} 