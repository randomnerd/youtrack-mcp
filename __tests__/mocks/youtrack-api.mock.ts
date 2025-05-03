import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { boardFixtures, issueFixtures, sprintFixtures } from '../fixtures';

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
  mockAxios.onGet(new RegExp(`${baseUrl}/agiles/\\d+`)).reply((config) => {
    const id = config.url?.split('/').pop();
    const board = boardFixtures.boards.find(b => b.id === id);
    return board ? [200, board] : [404, { error: 'Board not found' }];
  });

  // Issue endpoints
  mockAxios.onGet(createYouTrackUrl(baseUrl, '/issues')).reply(200, issueFixtures.listIssues);
  mockAxios.onGet(new RegExp(`${baseUrl}/issues/\\d+`)).reply((config) => {
    const id = config.url?.split('/').pop();
    const issue = issueFixtures.issues.find(i => i.id === id);
    return issue ? [200, issue] : [404, { error: 'Issue not found' }];
  });
  mockAxios.onGet(new RegExp(`${baseUrl}/issues/[A-Z]+-\\d+`)).reply((config) => {
    const idReadable = config.url?.split('/').pop();
    const issue = issueFixtures.issues.find(i => i.idReadable === idReadable);
    return issue ? [200, issue] : [404, { error: 'Issue not found' }];
  });
  
  // Search issues endpoint
  mockAxios.onGet(new RegExp(`${baseUrl}/issues\\?.*q=.*`)).reply(200, issueFixtures.listIssues);
  
  // Update issue endpoint
  mockAxios.onPost(new RegExp(`${baseUrl}/issues/\\d+`)).reply((config) => {
    const id = config.url?.split('/').pop();
    const issue = issueFixtures.issues.find(i => i.id === id);
    if (!issue) return [404, { error: 'Issue not found' }];
    
    const updates = JSON.parse(config.data);
    return [200, { ...issue, ...updates }];
  });

  // Sprint endpoints
  mockAxios.onGet(new RegExp(`${baseUrl}/agiles/\\d+/sprints`)).reply((config) => {
    const boardId = config.url?.split('/')[4];
    const sprints = boardId && sprintFixtures.sprintsByBoard[boardId] ? 
      sprintFixtures.sprintsByBoard[boardId] : [];
    return [200, sprints];
  });
  mockAxios.onGet(new RegExp(`${baseUrl}/agiles/\\d+/sprints/\\d+`)).reply((config) => {
    const urlParts = config.url?.split('/');
    const sprintId = urlParts?.pop();
    const sprint = sprintFixtures.sprints.find(s => s.id === sprintId);
    return sprint ? [200, sprint] : [404, { error: 'Sprint not found' }];
  });

  return mockAxios;
};

export const resetMocks = () => {
  mockAxios.reset();
};

export default mockAxios; 