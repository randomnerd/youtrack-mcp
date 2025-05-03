import { ProjectView } from '../../../src/views/projectView';
import { projectFixtures } from '../../fixtures';
import * as YouTrackTypes from '../../../src/types/youtrack';

describe('ProjectView', () => {
  describe('renderList', () => {
    it('should render a list of projects', () => {
      const projects = projectFixtures.projects;
      
      const result = ProjectView.renderList(projects);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain(`Found ${projects.length} projects:`);
      
      projects.forEach(project => {
        expect(result.content[0].text).toContain(`ID: ${project.id}`);
        expect(result.content[0].text).toContain(`Name: ${project.name}`);
      });
    });
    
    it('should handle empty projects list', () => {
      const result = ProjectView.renderList([]);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('No projects found.');
    });
    
    it('should handle null projects input', () => {
      const result = ProjectView.renderList(null as unknown as YouTrackTypes.Project[]);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('No projects found.');
    });
  });
  
  describe('renderDetail', () => {
    it('should render project details', () => {
      const project = projectFixtures.projects[0];
      
      const result = ProjectView.renderDetail(project);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Project Details:');
      expect(result.content[0].text).toContain(`ID: ${project.id}`);
      expect(result.content[0].text).toContain(`Name: ${project.name}`);
    });
    
    it('should handle project with missing optional fields', () => {
      const project = {
        id: 'test-1',
        name: 'Test Project',
        // shortName and description are missing
      } as YouTrackTypes.Project;
      
      const result = ProjectView.renderDetail(project);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Short Name: N/A');
      expect(result.content[0].text).toContain('Description: No description provided');
    });
    
    it('should handle null project input', () => {
      const result = ProjectView.renderDetail(null as unknown as YouTrackTypes.Project);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Project not found.');
    });
  });
  
  describe('renderMessage', () => {
    it('should render a message', () => {
      const message = 'Test message';
      
      const result = ProjectView.renderMessage(message);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe(message);
    });
  });
  
  describe('renderEmpty', () => {
    it('should render an empty message', () => {
      const message = 'No data';
      
      const result = ProjectView.renderEmpty(message);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe(message);
    });
  });
  
  describe('renderError', () => {
    it('should render an error message', () => {
      const error = new Error('Test error');
      
      const result = ProjectView.renderError(error.toString());
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Error:');
      expect(result.content[0].text).toContain('Test error');
    });
    
    it('should handle string error', () => {
      const errorMessage = 'Test error message';
      
      const result = ProjectView.renderError(errorMessage);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Error:');
      expect(result.content[0].text).toContain(errorMessage);
    });
  });
}); 