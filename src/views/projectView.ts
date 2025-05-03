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

  static renderEmpty = CommonView.renderEmpty;
  static renderError = CommonView.renderError;
} 