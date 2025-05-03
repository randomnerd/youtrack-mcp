import { ProjectModel } from '../../../src/models/project';
import { projectFixtures } from '../../fixtures';

describe('ProjectModel', () => {
  describe('getAll', () => {
    it('should return a list of all projects', async () => {
      const projects = await ProjectModel.getAll();
      expect(projects).toBeDefined();
      expect(projects.length).toBeGreaterThan(0);
      expect(projects).toEqual(projectFixtures.listProjects);
    });
  });

  describe('getById', () => {
    it('should return a project by its ID', async () => {
      const projectId = projectFixtures.projects[0].id;
      const project = await ProjectModel.getById(projectId);
      expect(project).toBeDefined();
      expect(project).not.toBeNull();
      expect(project?.id).toBe(projectId);
    });

    it('should return null for non-existent project ID', async () => {
      const project = await ProjectModel.getById('nonexistent');
      expect(project).toBeNull();
    });

    it('should throw an error when there is a problem fetching projects', async () => {
      // Mock getAll to throw an error
      jest.spyOn(ProjectModel, 'getAll').mockImplementationOnce(() => {
        throw new Error('Failed to fetch projects');
      });

      await expect(ProjectModel.getById('any-id')).rejects.toThrow(
        'Failed to get project by ID: Failed to fetch projects'
      );
    });
  });

  describe('findByName', () => {
    it('should find projects by name', async () => {
      const searchName = projectFixtures.projects[0].name.substring(0, 5);
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
    });

    it('should return all projects when search name is empty', async () => {
      const projects = await ProjectModel.findByName('');
      expect(projects).toEqual(projectFixtures.listProjects);
    });

    it('should throw an error when there is a problem fetching projects', async () => {
      // Mock getAll to throw an error
      jest.spyOn(ProjectModel, 'getAll').mockImplementationOnce(() => {
        throw new Error('Failed to fetch projects');
      });

      await expect(ProjectModel.findByName('any-name')).rejects.toThrow(
        'Failed to find projects by name: Failed to fetch projects'
      );
    });
  });
}); 