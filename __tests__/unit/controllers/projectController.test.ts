import { projectFixtures } from '../../fixtures';
import { ProjectController } from '../../../src/controllers/projectController';
import { ProjectModel } from '../../../src/models/project';

// Mock the ProjectModel
jest.mock('../../../src/models/project', () => ({
  ProjectModel: {
    getAll: jest.fn()
  }
}));

describe('Project Controller', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('listProjects', () => {
    it('should return all projects', async () => {
      // Setup the mock implementation
      (ProjectModel.getAll as jest.Mock).mockResolvedValue(projectFixtures.projects);
      
      // Call the controller function
      const result = await ProjectController.listProjects();
      
      // Verify the results
      expect(ProjectModel.getAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('should handle empty projects list', async () => {
      // Setup empty projects list
      (ProjectModel.getAll as jest.Mock).mockResolvedValue([]);
      
      const result = await ProjectController.listProjects();
      
      expect(ProjectModel.getAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      // Content should contain message about no projects found
      expect(JSON.stringify(result.content)).toContain('No projects found');
    });

    it('should handle errors', async () => {
      const errorMessage = 'Failed to fetch projects';
      (ProjectModel.getAll as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      const result = await ProjectController.listProjects();
      
      expect(ProjectModel.getAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError', true);
      // Error message should be in the content
      expect(JSON.stringify(result.content)).toContain(errorMessage);
    });
  });
}); 