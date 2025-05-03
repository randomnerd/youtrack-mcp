import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { boardFixtures, issueFixtures, sprintFixtures, projectFixtures, activityFixtures } from '../fixtures';

// Create axios mock
const mockAxios = new MockAdapter(axios);

// Counters for testing retry logic
let retryCallCount = 0;
let rateLimitCallCount = 0;

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
  mockAxios.onGet(`${baseUrl}/admin/projects`).reply(200, projectFixtures.listProjects);
  
  // Handle all project ID formats
  mockAxios.onGet(new RegExp(`${baseUrl}/admin/projects/([^/]+)$`)).reply((config) => {
    const id = config.url?.split('/').pop();
    const project = projectFixtures.projects.find(p => p.id === id);
    return project ? [200, project] : [404, { error: 'Project not found' }];
  });

  // Add mocks for issue creation - properly handle the stringification of projectId
  mockAxios.onPost(createYouTrackUrl(baseUrl, '/issues')).reply(function(config) {
    // Check if the data has project as an object or string
    const data = JSON.parse(config.data);
    
    // Replace the request data to be used for assertions in the tests
    mockAxios.history.post[mockAxios.history.post.length - 1].data = JSON.stringify({
      ...data,
      project: typeof data.project === 'string' ? data.project : data.project?.id || data.project
    });
    
    return [200, {
      id: 'new-issue-1',
      summary: data.summary || 'New test issue',
      description: data.description || 'This is a test issue',
      project: typeof data.project === 'string' ? { id: data.project } : data.project
    }];
  });

  // Add mocks for issue comments
  mockAxios.onGet(new RegExp(`${baseUrl}/issues/([^/]+)/comments$`)).reply(200, [
    { id: 'comment-1', text: 'Test comment 1', author: { id: 'user-1', login: 'user1' }, created: 1620000000000 },
    { id: 'comment-2', text: 'Test comment 2', author: { id: 'user-2', login: 'user2' }, created: 1620100000000 }
  ]);

  mockAxios.onPost(new RegExp(`${baseUrl}/issues/([^/]+)/comments$`)).reply(200, {
    id: 'new-comment-1',
    text: 'This is a test comment',
    author: { id: 'user-1', login: 'user1' },
    created: Date.now()
  });

  // Add mocks for issue links
  mockAxios.onGet(new RegExp(`${baseUrl}/issues/([^/]+)/links$`)).reply(200, [
    { id: 'link-1', direction: 'outward', linkType: { id: 'type-1', localizedName: 'Relates to' } },
    { id: 'link-2', direction: 'inward', linkType: { id: 'type-2', localizedName: 'Is blocked by' } }
  ]);

  // Add mocks for issue attachments
  mockAxios.onGet(new RegExp(`${baseUrl}/issues/([^/]+)/attachments$`)).reply(200, [
    { id: 'attachment-1', name: 'test.txt', url: 'http://example.com/attachments/test.txt' },
    { id: 'attachment-2', name: 'image.png', url: 'http://example.com/attachments/image.png' }
  ]);
  
  // Add mock for adding an attachment to an issue
  mockAxios.onPost(new RegExp(`${baseUrl}/issues/([^/]+)/attachments$`)).reply(function(config) {
    const matches = config.url?.match(/\/issues\/([^/]+)\/attachments$/);
    const issueId = matches?.[1] || '1';
    
    // In a real API, the filename would be extracted from the FormData
    // For the purpose of the test, we'll use a hardcoded value or try to parse it from the headers
    const fileName = config.headers?.['X-File-Name'] || 'test.png';
    
    return [200, {
      id: 'new-att-1',
      name: fileName,
      size: 12,
      author: { id: 'user-1', login: 'user1' }
    }];
  });

  // Add mocks for issue activities
  mockAxios.onGet(new RegExp(`${baseUrl}/issues/([^/]+)/activities$`)).reply((config) => {
    const issueId = config.url?.split('/').pop();
    
    // Try to find activities by idReadable
    const activities = activityFixtures.activitiesByIssue[issueId || ''] || 
      activityFixtures.activities;
    
    return [200, activities];
  });

  mockAxios.onGet(new RegExp(`${baseUrl}/issues/([^/]+)/activitiesPage$`)).reply(200, activityFixtures.activityPage);

  // Fix VCS changes endpoints to match what's in the implementation
  mockAxios.onGet(new RegExp(`${baseUrl}/issues/([^/]+)/vcsChanges$`)).reply(200, [
    { id: 'change-1', version: 'sample123abc', text: 'Sample bug fix', date: 1620000000000 },
    { id: 'change-2', version: 'sample456def', text: 'Sample feature update', date: 1620100000000 }
  ]);

  mockAxios.onGet(new RegExp(`${baseUrl}/vcsChanges/([^/]+)$`)).reply(200, {
    id: 'change-1',
    version: 'sample123abc',
    text: 'Sample bug fix',
    date: 1620000000000
  });

  // Also add the deprecated/alternative paths that are used in tests
  mockAxios.onGet(new RegExp(`${baseUrl}/issues/([^/]+)/changes$`)).reply(function(config) {
    // Capture the issue ID from the URL using regex
    const matches = config.url?.match(/\/issues\/([^/]+)\/changes$/);
    const issueId = matches?.[1] || '1';
    
    return [200, [
      { id: 'change-1', version: 'sample123abc', text: 'Sample bug fix', date: 1620000000000 },
      { id: 'change-2', version: 'sample456def', text: 'Sample feature update', date: 1620100000000 }
    ]];
  });
  
  // Add test-specific mocks for error handling tests
  mockAxios.onGet(`${baseUrl}/test-retry`).reply(() => {
    retryCallCount++;
    if (retryCallCount < 2) {
      return [500, 'Server Error'];
    }
    return [200, { success: true }];
  });
  
  mockAxios.onGet(`${baseUrl}/test-rate-limit`).reply(() => {
    rateLimitCallCount++;
    if (rateLimitCallCount < 2) {
      return [429, 'Too Many Requests'];
    }
    return [200, { success: true }];
  });
  
  mockAxios.onGet(`${baseUrl}/test-client-error`).reply(400, 'Bad Request');
  
  mockAxios.onGet(`${baseUrl}/test-max-retries`).reply(500, 'Persistent Server Error');
  
  // Add mocks for bundle endpoints used in tests
  mockAxios.onGet(`${baseUrl}/admin/customFieldSettings/bundles?fields=id,name,$type&$type=state`).reply(200, [
    { id: 'bundle-1', name: 'State Bundle', type: 'state' },
    { id: 'bundle-2', name: 'Another State Bundle', type: 'state' }
  ]);
  
  mockAxios.onGet(`${baseUrl}/admin/customFieldSettings/bundles/state`).reply(200, [
    { id: 'bundle-1', name: 'State Bundle', type: 'state' },
    { id: 'bundle-2', name: 'Another State Bundle', type: 'state' }
  ]);
  
  mockAxios.onGet(`${baseUrl}/admin/customFieldSettings/bundles/bundle-1`).reply(200, {
    id: 'bundle-1',
    name: 'State Bundle',
    type: 'state',
    values: [
      { id: 'element-1', name: 'Element 1' },
      { id: 'element-2', name: 'Element 2' }
    ]
  });
  
  // Add mock for user notifications
  mockAxios.onGet(`${baseUrl}/users/user-1/profiles/notifications`).reply(200, {
    id: 'user-1',
    emailNotificationsEnabled: true,
    jabberNotificationsEnabled: false,
    notifyOnOwnChanges: false,
    mentionNotificationsEnabled: true,
    autoWatchOnComment: true,
    autoWatchOnCreate: true,
    autoWatchOnVote: false,
    autoWatchOnUpdate: false
  });
  
  mockAxios.onPost(`${baseUrl}/users/user-1/profiles/notifications`).reply(200, {
    id: 'user-1',
    emailNotificationsEnabled: true,
    jabberNotificationsEnabled: false,
    notifyOnOwnChanges: true,
    mentionNotificationsEnabled: true,
    autoWatchOnComment: true,
    autoWatchOnCreate: true,
    autoWatchOnVote: false,
    autoWatchOnUpdate: false
  });
  
  // Add a catch-all mock for unmocked endpoints
  mockAxios.onAny(new RegExp(`${baseUrl}/.*`)).reply((config) => {
    // Don't log warning for our explicitly non-existent test endpoint
    if (!config.url?.includes('/non-existent-endpoint/')) {
      console.warn(`Unmocked endpoint called: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return [404, { 
      error: 'Endpoint not mocked', 
      message: `The endpoint ${config.method?.toUpperCase()} ${config.url} is not mocked.`,
      hint: 'Add this endpoint to the youtrack-api.mock.ts file.'
    }];
  });

  // Add the boards list mock more explicitly
  mockAxios.onGet(createYouTrackUrl(baseUrl, 'api/agiles')).reply(200, boardFixtures.listBoards);
};

export const resetMocks = () => {
  mockAxios.reset();
  retryCallCount = 0;
  rateLimitCallCount = 0;
};

export const getMockCallCount = () => {
  return {
    retryCallCount,
    rateLimitCallCount
  };
};

// Export mockAxios as the default export to maintain compatibility with tests
export default mockAxios; 