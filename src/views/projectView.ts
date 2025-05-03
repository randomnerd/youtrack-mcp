import * as YouTrackTypes from '../types/youtrack';
import { CommonView, McpResponse } from './common';
import { ControllerResult, ProjectDetailResult, ProjectListResult } from '../types/controllerResults';

export class ProjectView {
  static renderList(result: ControllerResult<ProjectListResult>): McpResponse {
    if (!result.success || !result.data) {
      return this.renderError(result.error || 'Failed to fetch projects');
    }
    
    const { projects, total } = result.data;
    
    if (!projects || projects.length === 0) {
      return this.renderEmpty("No projects found.");
    }
    
    const projectsText = projects.map(project => 
      `ID: ${project.id}\nName: ${project.name}\nShort Name: ${project.shortName}`
    ).join('\n\n');
    
    return {
      content: [{ 
        type: "text", 
        text: `Found ${total} projects:\n\n${projectsText}` 
      }]
    };
  }

  /**
   * Render a single project detail view
   * @param result - The controller result with project details
   * @returns Formatted MCP response with project details
   */
  static renderDetail(result: ControllerResult<ProjectDetailResult>): McpResponse {
    if (!result.success || !result.data) {
      return this.renderError(result.error || 'Failed to fetch project details');
    }
    
    const { project } = result.data;
    
    if (!project) {
      return this.renderEmpty("Project not found.");
    }
    
    const detailText = `Project Details:
ID: ${project.id}
Name: ${project.name}
Short Name: ${project.shortName || 'N/A'}
Description: ${project.description || 'No description provided'}`;
    
    return {
      content: [{ 
        type: "text", 
        text: detailText 
      }]
    };
  }

  /**
   * Render an informational message
   * @param message - The message to render
   * @returns Formatted MCP response with message
   */
  static renderMessage(message: string): McpResponse {
    return {
      content: [{ 
        type: "text", 
        text: message 
      }]
    };
  }

  static renderEmpty = CommonView.renderEmpty;
  static renderError = CommonView.renderError;
} 