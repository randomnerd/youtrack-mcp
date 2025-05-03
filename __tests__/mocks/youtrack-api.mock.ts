import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { boardFixtures, issueFixtures, sprintFixtures, projectFixtures } from '../fixtures';

// Create axios mock
const mockAxios = new MockAdapter(axios);

// Helper to create YouTrack API URL
const createYouTrackUrl = (baseUrl: string, endpoint: string) => {
  const url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${url}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Setup mock responses for different YouTrack API endpoints
export const setupYouTrackApiMocks = (baseUrl: string) => {
  // Board endpoints
  mockAxios.onGet(createYouTrackUrl(baseUrl, '/agiles')).reply(200, boardFixtures.listBoards);
  
  // More flexible regex for board ID to handle both numeric IDs and text-based IDs
  mockAxios.onGet(new RegExp(`${baseUrl}/agiles/([^/]+)$`)).reply((config) => {
    const id = config.url?.split('/').pop();
    const board = boardFixtures.boards.find(b => b.id === id);
    return board ? [200, board] : [404, { error: 'Board not found' }];
  });

  // Issue endpoints
  mockAxios.onGet(createYouTrackUrl(baseUrl, '/issues')).reply(200, issueFixtures.listIssues);
  
  // Handle both numeric and readable IDs
  mockAxios.onGet(new RegExp(`${baseUrl}/issues/([^/]+)$`)).reply((config) => {
    const id = config.url?.split('/').pop();
    // Try to find by ID first
    let issue = issueFixtures.issues.find(i => i.id === id);
    // If not found, try by idReadable
    if (!issue) {
      issue = issueFixtures.issues.find(i => i.idReadable === id);
    }
    return issue ? [200, issue] : [404, { error: 'Issue not found' }];
  });
  
  // Search issues endpoint
  mockAxios.onGet(new RegExp(`${baseUrl}/issues\\?.*q=.*`)).reply(200, issueFixtures.listIssues);
  
  // Update issue endpoint
  mockAxios.onPost(new RegExp(`${baseUrl}/issues/([^/]+)$`)).reply((config) => {
    const id = config.url?.split('/').pop();
    // Try to find by ID first
    let issue = issueFixtures.issues.find(i => i.id === id);
    // If not found, try by idReadable
    if (!issue) {
      issue = issueFixtures.issues.find(i => i.idReadable === id);
    }
    
    if (!issue) return [404, { error: 'Issue not found' }];
    
    const updates = JSON.parse(config.data);
    return [200, { ...issue, ...updates }];
  });

  // Sprint endpoints
  mockAxios.onGet(new RegExp(`${baseUrl}/agiles/([^/]+)/sprints$`)).reply((config) => {
    const urlParts = config.url?.split('/');
    const boardId = urlParts ? urlParts[urlParts.length - 2] : null;
    
    if (!boardId) return [404, { error: 'Board not found' }];
    
    // Return sprints for the specified boardId, or empty array if none exist
    const sprints = sprintFixtures.sprintsByBoard[boardId] || [];
    return [200, sprints];
  });

  mockAxios.onGet(new RegExp(`${baseUrl}/agiles/([^/]+)/sprints/([^/]+)$`)).reply((config) => {
    const urlParts = config.url?.split('/');
    const sprintId = urlParts ? urlParts[urlParts.length - 1] : null;
    const boardId = urlParts ? urlParts[urlParts.length - 3] : null;
    
    if (!boardId) return [404, { error: 'Board not found' }];
    
    // For non-existent sprint ID, return Sprint not found
    if (sprintId === 'nonexistent') {
      return [404, { error: 'Sprint not found' }];
    }
    
    const sprint = sprintFixtures.sprints.find(s => s.id === sprintId);
    return sprint ? [200, sprint] : [404, { error: 'Sprint not found' }];
  });

  // Project endpoints
  mockAxios.onGet(createYouTrackUrl(baseUrl, '/admin/projects')).reply(200, projectFixtures.listProjects);
  
  // Handle all project ID formats
  mockAxios.onGet(new RegExp(`${baseUrl}/admin/projects/([^/]+)$`)).reply((config) => {
    const id = config.url?.split('/').pop();
    const project = projectFixtures.projects.find(p => p.id === id);
    return project ? [200, project] : [404, { error: 'Project not found' }];
  });

  // Add a catch-all mock for unmocked endpoints - will return 404 with more information
  mockAxios.onAny(new RegExp(`${baseUrl}/.*`)).reply((config) => {
    console.warn(`Unmocked endpoint called: ${config.method?.toUpperCase()} ${config.url}`);
    return [404, { 
      error: 'Endpoint not mocked', 
      message: `The endpoint ${config.method?.toUpperCase()} ${config.url} is not mocked.`,
      hint: 'Add this endpoint to the youtrack-api.mock.ts file.'
    }];
  });

  return mockAxios;
};

export const resetMocks = () => {
  mockAxios.reset();
};

export default mockAxios; 