import { ProjectModel } from '../../../src/models/project';
import * as youtrackClientModule from '../../../src/youtrack-client';

// Create mock project data directly to avoid import issues
const mockProjects = [
  {
    id: '1',
    name: 'Main Project',
    shortName: 'MAIN',
    description: 'This is the main project for testing',
    $type: 'Project'
  },
  {
    id: '2',
    name: 'Secondary Project',
    shortName: 'SEC',
    description: 'Secondary project for feature development',
    $type: 'Project'
  },
  {
    id: '3',
    name: 'Bug Tracker',
    shortName: 'BUG',
    description: 'Project dedicated to bug tracking',
    $type: 'Project'
  }
];

// Directly mock the module functions we need
jest.mock('../../../src/youtrack-client', () => ({
  __esModule: true,
  default: {
    listProjects: jest.fn()
  }
}));

// Create a typesafe reference to the mocked function
const mockListProjects = youtrackClientModule.default.listProjects as jest.Mock;

describe('ProjectModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up the mock implementation for each test
    mockListProjects.mockResolvedValue(mockProjects);
  });
  
  describe('getAll', () => {
    it('should return a list of all projects', async () => {
      const projects = await ProjectModel.getAll();
      expect(projects).toBeDefined();
      expect(projects.length).toBeGreaterThan(0);
      expect(projects).toEqual(mockProjects);
      expect(mockListProjects).toHaveBeenCalledTimes(1);
    });
  });

  describe('getById', () => {
    it('should return a project by its ID', async () => {
      const projectId = mockProjects[0].id;
      const project = await ProjectModel.getById(projectId);
      expect(project).toBeDefined();
      expect(project).not.toBeNull();
      expect(project?.id).toBe(projectId);
      expect(mockListProjects).toHaveBeenCalledTimes(1);
    });

    it('should return null for non-existent project ID', async () => {
      const project = await ProjectModel.getById('nonexistent');
      expect(project).toBeNull();
      expect(mockListProjects).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when there is a problem fetching projects', async () => {
      // Mock listProjects to throw an error
      mockListProjects.mockRejectedValueOnce(new Error('Failed to fetch projects'));

      await expect(ProjectModel.getById('any-id')).rejects.toThrow(
        'Failed to get project by ID: Failed to fetch projects'
      );
    });
  });

  describe('findByName', () => {
    it('should find projects by name', async () => {
      const searchName = mockProjects[0].name.substring(0, 5);
      const projects = await ProjectModel.findByName(searchName);
      expect(projects).toBeDefined();
      expect(projects.length).toBeGreaterThan(0);
      
      // Verify each project contains the search term in name or shortName
      projects.forEach(project => {
        const nameMatches = project.name.toLowerCase().includes(searchName.toLowerCase());
        const shortNameMatches = project.shortName ? 
          project.shortName.toLowerCase().includes(searchName.toLowerCase()) : 
          false;
        expect(nameMatches || shortNameMatches).toBe(true);
      });
      expect(mockListProjects).toHaveBeenCalledTimes(1);
    });

    it('should return all projects when search name is empty', async () => {
      const projects = await ProjectModel.findByName('');
      expect(projects).toEqual(mockProjects);
      expect(mockListProjects).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when there is a problem fetching projects', async () => {
      // Mock listProjects to throw an error
      mockListProjects.mockRejectedValueOnce(new Error('Failed to fetch projects'));

      await expect(ProjectModel.findByName('any-name')).rejects.toThrow(
        'Failed to find projects by name: Failed to fetch projects'
      );
    });
  });
}); 