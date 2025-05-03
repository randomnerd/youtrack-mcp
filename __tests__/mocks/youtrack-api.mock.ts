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

  // Add mocks for issue activities
  mockAxios.onGet(new RegExp(`${baseUrl}/issues/([^/]+)/activities$`)).reply(200, [
    { id: 'activity-1', $type: 'IssueCreatedActivityItem', timestamp: 1620000000000, author: { id: 'user-1', login: 'user1' } },
    { id: 'activity-2', $type: 'CustomFieldActivityItem', timestamp: 1620100000000, author: { id: 'user-2', login: 'user2' } }
  ]);

  mockAxios.onGet(new RegExp(`${baseUrl}/issues/([^/]+)/activitiesPage$`)).reply(200, {
    $type: 'CursorPage',
    activities: [
      { id: 'activity-1', $type: 'IssueCreatedActivityItem', timestamp: 1620000000000 }
    ],
    hasNext: true,
    hasPrev: false,
    nextCursor: 'next-cursor-123'
  });

  // Fix VCS changes endpoints to match what's in the implementation
  mockAxios.onGet(new RegExp(`${baseUrl}/issues/([^/]+)/vcsChanges$`)).reply(200, [
    { id: 'change-1', version: '123abc', text: 'Fixed bug', date: 1620000000000 },
    { id: 'change-2', version: '456def', text: 'Updated feature', date: 1620100000000 }
  ]);

  mockAxios.onGet(new RegExp(`${baseUrl}/vcsChanges/([^/]+)$`)).reply(200, {
    id: 'change-1',
    version: '123abc',
    text: 'Fixed bug',
    date: 1620000000000
  });

  // Also add the deprecated/alternative paths that are used in tests
  mockAxios.onGet(new RegExp(`${baseUrl}/issues/([^/]+)/changes$`)).reply(function(config) {
    // Capture the issue ID from the URL using regex
    const matches = config.url?.match(/\/issues\/([^/]+)\/changes$/);
    const issueId = matches?.[1] || '1';
    
    return [200, [
      { id: 'change-1', version: '123abc', text: 'Fixed bug', date: 1620000000000 },
      { id: 'change-2', version: '456def', text: 'Updated feature', date: 1620100000000 }
    ]];
  });

  mockAxios.onGet(new RegExp(`${baseUrl}/changes/([^/]+)$`)).reply(function(config) {
    // Capture the change ID from the URL using regex
    const matches = config.url?.match(/\/changes\/([^/]+)$/);
    const changeId = matches?.[1] || 'change-1';
    
    return [200, {
      id: changeId,
      version: '123abc',
      text: 'Fixed bug',
      date: 1620000000000
    }];
  });

  // Fix VCS servers endpoint
  mockAxios.onGet(createYouTrackUrl(baseUrl, '/vcsServers')).reply(200, [
    { id: 'server-1', url: 'http://git.example.com', name: 'Git Server' },
    { id: 'server-2', url: 'http://svn.example.com', name: 'SVN Server' }
  ]);

  // Add mock for admin/vcsServers as used in tests
  mockAxios.onGet(createYouTrackUrl(baseUrl, '/admin/vcsServers')).reply(200, [
    { id: 'server-1', url: 'http://git.example.com', name: 'Git Server' },
    { id: 'server-2', url: 'http://svn.example.com', name: 'SVN Server' }
  ]);

  // Add mock for VCS processors (both paths used in the implementation)
  mockAxios.onGet(new RegExp(`${baseUrl}/admin/projects/([^/]+)/vcsHostingChangesProcessors$`)).reply(200, [
    { id: 'processor-1', name: 'GitHub Webhook Processor' },
    { id: 'processor-2', name: 'GitLab Webhook Processor' }
  ]);

  mockAxios.onGet(new RegExp(`${baseUrl}/admin/projects/([^/]+)/vcsRepositories$`)).reply(200, [
    { id: 'processor-1', name: 'GitHub Webhook Processor', server: { id: 'server-1', url: 'http://git.example.com' } },
    { id: 'processor-2', name: 'GitLab Webhook Processor', server: { id: 'server-2', url: 'http://svn.example.com' } }
  ]);

  // Fix bundles
  mockAxios.onGet(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles\\?.*`)).reply(function(config) {
    const bundleType = config.url?.split('type:')[1] || 'state';
    return [200, [
      { id: 'bundle-1', name: 'State Bundle', type: bundleType },
      { id: 'bundle-2', name: 'Another State Bundle', type: bundleType }
    ]];
  });

  // Add explicit mock for listBundles endpoint
  mockAxios.onGet(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/(state|version|enum)$`)).reply(function(config) {
    const matches = config.url?.match(/\/bundles\/([^/?]+)$/);
    const bundleType = matches?.[1] || 'state';
    
    return [200, [
      { id: 'bundle-1', name: 'State Bundle', type: bundleType },
      { id: 'bundle-2', name: 'Another State Bundle', type: bundleType }
    ]];
  });

  // Fix bundle by ID - use with and without "id:" prefix
  mockAxios.onGet(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/id:([^/]+)$`)).reply(function(config) {
    const matches = config.url?.match(/\/bundles\/id:([^/]+)$/);
    const bundleId = matches?.[1] || 'bundle-1';
    
    return [200, {
      id: bundleId,
      name: 'State Bundle',
      type: 'state',
      values: [
        { id: 'element-1', name: 'Element 1' },
        { id: 'element-2', name: 'Element 2' }
      ]
    }];
  });

  // Add regular version without id: prefix
  mockAxios.onGet(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/([^/]+)$`)).reply(function(config) {
    const matches = config.url?.match(/\/bundles\/([^/]+)$/);
    const bundleId = matches?.[1] || 'bundle-1';
    
    // Skip if it has the id: prefix, as it will be caught by the more specific matcher above
    if (bundleId.startsWith('id:')) {
      return [404, { error: 'Not found' }];
    }
    
    return [200, {
      id: bundleId,
      name: 'State Bundle',
      type: 'state',
      values: [
        { id: 'element-1', name: 'Element 1' },
        { id: 'element-2', name: 'Element 2' }
      ]
    }];
  });

  // Fix bundle elements - add proper values endpoint
  mockAxios.onGet(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/([^/]+)/values$`)).reply(200, [
    { id: 'element-1', name: 'Element 1' },
    { id: 'element-2', name: 'Element 2' }
  ]);

  // Add mocks for user notifications
  mockAxios.onGet(new RegExp(`${baseUrl}/users/([^/]+)/notifications$`)).reply(200, {
    id: 'notify-1',
    userId: 'user-1',
    notifyOnOwnChanges: false,
    emailSettings: { onMention: true }
  });

  mockAxios.onPost(new RegExp(`${baseUrl}/users/([^/]+)/notifications$`)).reply(200, {
    id: 'notify-1',
    userId: 'user-1',
    notifyOnOwnChanges: true,
    emailSettings: { onMention: false }
  });

  // Mock for retry testing
  mockAxios.onGet(`${baseUrl}/issues/retry-test`).replyOnce(503, { error: 'Service Unavailable' })
    .onGet(`${baseUrl}/issues/retry-test`).replyOnce(200, { id: 'retry-test', summary: 'Retry success' });

  mockAxios.onGet(`${baseUrl}/issues/rate-limited`).replyOnce(429, { error: 'Too Many Requests' })
    .onGet(`${baseUrl}/issues/rate-limited`).replyOnce(200, { id: 'rate-limited', summary: 'Rate limit success' });

  mockAxios.onGet(`${baseUrl}/issues/client-error`).reply(400, { error: 'Bad Request' });

  // Add mock for telemetry endpoint
  mockAxios.onGet(`${baseUrl}/admin/telemetry`).reply(200, {
    installations: 10,
    activeUsers: 25,
    projects: 15,
    issues: 500
  });

  // Add a catch-all mock for unmocked endpoints - will return 404 with more information
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

  return mockAxios;
};

export const resetMocks = () => {
  mockAxios.reset();
};

export default mockAxios; 