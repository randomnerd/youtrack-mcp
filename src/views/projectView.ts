import * as YouTrackTypes from '../types/youtrack';
import { CommonView, McpResponse } from './common';

export class ProjectView {
  static renderList(projects: YouTrackTypes.Project[]): McpResponse {
    if (!projects || projects.length === 0) {
      return this.renderEmpty("No projects found.");
    }
    
    const projectsText = projects.map(project => 
      `ID: ${project.id}\nName: ${project.name}\nShort Name: ${project.shortName}`
    ).join('\n\n');
    
    return {
      content: [{ 
        type: "text", 
        text: `Found ${projects.length} projects:\n\n${projectsText}` 
      }]
    };
  }

  /**
   * Render a single project detail view
   * @param project - The project to render
   * @returns Formatted MCP response with project details
   */
  static renderDetail(project: YouTrackTypes.Project): McpResponse {
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