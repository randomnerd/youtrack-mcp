import { projectFixtures } from '../../fixtures';
import { ProjectController } from '../../../src/controllers/projectController';
import { ProjectModel } from '../../../src/models/project';
import { URL } from 'url';
import { createProjectListResult, createProjectDetailResult, createErrorResult } from '../../helpers/testHelpers';
import { ControllerResult, ProjectDetailResult, ProjectListResult } from '../../../src/types/controllerResults';

// Mock the ProjectModel
jest.mock('../../../src/models/project', () => ({
  ProjectModel: {
    getAll: jest.fn(),
    getById: jest.fn(),
    findByName: jest.fn()
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
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('projects');
      expect(Array.isArray(result.data?.projects)).toBe(true);
      expect(result.data?.projects.length).toBeGreaterThan(0);
    });

    it('should handle empty projects list', async () => {
      // Setup empty projects list
      (ProjectModel.getAll as jest.Mock).mockResolvedValue([]);
      
      const result = await ProjectController.listProjects();
      
      expect(ProjectModel.getAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('projects');
      expect(Array.isArray(result.data?.projects)).toBe(true);
      expect(result.data?.projects.length).toBe(0);
    });

    it('should handle errors', async () => {
      const errorMessage = 'Failed to fetch projects';
      (ProjectModel.getAll as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      const result = await ProjectController.listProjects();
      
      expect(ProjectModel.getAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain(errorMessage);
    });
  });

  describe('getProject', () => {
    it('should return a specific project by ID', async () => {
      const project = projectFixtures.projects[0];
      (ProjectModel.getById as jest.Mock).mockResolvedValue(project);
      
      const result = await ProjectController.getProject(project.id);
      
      expect(ProjectModel.getById).toHaveBeenCalledWith(project.id);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('project');
      expect(result.data?.project).toEqual(project);
    });

    it('should handle missing project', async () => {
      const projectId = 'nonexistent-id';
      (ProjectModel.getById as jest.Mock).mockResolvedValue(null);
      
      const result = await ProjectController.getProject(projectId);
      
      expect(ProjectModel.getById).toHaveBeenCalledWith(projectId);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain(`No project found with ID: ${projectId}`);
    });

    it('should handle errors when fetching a project', async () => {
      const projectId = '123';
      const errorMessage = 'Failed to fetch project';
      (ProjectModel.getById as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      const result = await ProjectController.getProject(projectId);
      
      expect(ProjectModel.getById).toHaveBeenCalledWith(projectId);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain(errorMessage);
    });
  });

  describe('findProjectsByName', () => {
    it('should return projects matching the name', async () => {
      const projectName = 'Test';
      const matchingProjects = [projectFixtures.projects[0]];
      (ProjectModel.findByName as jest.Mock).mockResolvedValue(matchingProjects);
      
      const result = await ProjectController.findProjectsByName(projectName);
      
      expect(ProjectModel.findByName).toHaveBeenCalledWith(projectName);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('projects');
      expect(result.data?.projects).toEqual(matchingProjects);
    });

    it('should handle no matching projects', async () => {
      const projectName = 'NonExistent';
      (ProjectModel.findByName as jest.Mock).mockResolvedValue([]);
      
      const result = await ProjectController.findProjectsByName(projectName);
      
      expect(ProjectModel.findByName).toHaveBeenCalledWith(projectName);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('projects');
      expect(result.data?.projects.length).toBe(0);
    });

    it('should handle errors when searching projects', async () => {
      const projectName = 'Test';
      const errorMessage = 'Failed to search projects';
      (ProjectModel.findByName as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      const result = await ProjectController.findProjectsByName(projectName);
      
      expect(ProjectModel.findByName).toHaveBeenCalledWith(projectName);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain(errorMessage);
    });
  });

  describe('handleResourceRequest', () => {
    it('should fetch and return a specific project when projectId is provided', async () => {
      const project = projectFixtures.projects[0];
      const uri = new URL(`https://example.com/projects/${project.id}`);
      const req = { params: { projectId: project.id } };
      
      (ProjectModel.getById as jest.Mock).mockResolvedValue(project);
      
      const result = await ProjectController.handleResourceRequest(uri, req as any);
      
      expect(ProjectModel.getById).toHaveBeenCalledWith(project.id);
      expect(result).toHaveProperty('contents');
      expect(result.contents[0]).toHaveProperty('uri', uri.href);
      expect((result.contents[0] as {uri: string, text: string}).text).toContain(project.name);
    });

    it('should list all projects when no projectId is provided', async () => {
      const uri = new URL('https://example.com/projects');
      const req = { params: {} };
      
      (ProjectModel.getAll as jest.Mock).mockResolvedValue(projectFixtures.projects);
      
      const result = await ProjectController.handleResourceRequest(uri, req as any);
      
      expect(ProjectModel.getAll).toHaveBeenCalled();
      expect(result).toHaveProperty('contents');
      expect(result.contents[0]).toHaveProperty('uri', uri.href);
      expect((result.contents[0] as {uri: string, text: string}).text).toContain(projectFixtures.projects[0].name);
    });

    it('should handle error during resource request', async () => {
      const uri = new URL('https://example.com/projects');
      const req = { params: {} };
      const errorMessage = 'Failed to handle resource request';
      
      (ProjectModel.getAll as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      const result = await ProjectController.handleResourceRequest(uri, req as any);
      
      expect(result).toHaveProperty('contents');
      expect(result.contents[0]).toHaveProperty('uri', uri.href);
      expect((result.contents[0] as {uri: string, text: string}).text).toContain(errorMessage);
    });
  });
}); 