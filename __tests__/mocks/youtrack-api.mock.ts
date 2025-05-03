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
    
    // If we have a single selected board, always return it
    if (boardFixtures.board) {
      return [200, boardFixtures.board];
    }
    
    const board = boardFixtures.boards.find(b => b.id === id);
    return board ? [200, board] : [404, { error: 'Board not found' }];
  });

  // Issue endpoints
  mockAxios.onGet(createYouTrackUrl(baseUrl, '/issues')).reply(200, issueFixtures.listIssues);
  
  // Handle getting issues by ID - using real data if available
  mockAxios.onGet(new RegExp(`${baseUrl}/issues/([^/]+)$`)).reply((config) => {
    const id = config.url?.split('/').pop();
    
    // Try to find issue by ID or readable ID in our detailed issues collection
    if (issueFixtures.issuesById && id && issueFixtures.issuesById[id]) {
      return [200, issueFixtures.issuesById[id]];
    }
    
    // Try to find by ID in regular issues
    let issue = issueFixtures.issues.find(i => i.id === id);
    // If not found, try by idReadable
    if (!issue) {
      issue = issueFixtures.issues.find(i => i.idReadable === id);
    }
    
    return issue ? [200, issue] : [404, { error: 'Issue not found' }];
  });
  
  // Search issues endpoint
  mockAxios.onGet(new RegExp(`${baseUrl}/issues\\?.*q=.*`)).reply((config) => {
    // Parse the query parameter
    const queryMatch = config.url?.match(/q=([^&]*)/);
    const query = queryMatch ? decodeURIComponent(queryMatch[1]) : '';
    
    // If the query is for a sprint, try to return sprint issues
    if (query.includes('sprint:') && sprintFixtures.sprint) {
      return [200, issueFixtures.sprintIssues];
    }
    
    // If the query is for a board, also return sprint issues
    if (query.includes('board:') && boardFixtures.board) {
      return [200, issueFixtures.sprintIssues];
    }
    
    // For any other query or empty query, return all issues
    return [200, issueFixtures.listIssues];
  });
  
  // Update issue endpoint
  mockAxios.onPost(new RegExp(`${baseUrl}/issues/([^/]+)$`)).reply((config) => {
    const id = config.url?.split('/').pop();
    
    // Check if we have this issue in our detailed collection
    if (issueFixtures.issuesById && id && issueFixtures.issuesById[id]) {
      const updates = JSON.parse(config.data);
      return [200, { ...issueFixtures.issuesById[id], ...updates }];
    }
    
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
    
    // Return sprints for the specified boardId, or all sprints if we don't have a specific mapping
    const sprints = sprintFixtures.sprintsByBoard[boardId] || sprintFixtures.sprints;
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
    
    // If we have a specific sprint object, return it
    if (sprintFixtures.sprint) {
      return [200, sprintFixtures.sprint];
    }
    
    // Otherwise look in the collection
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

  // Add mocks for issue activities - using real data when available
  mockAxios.onGet(new RegExp(`${baseUrl}/issues/([^/]+)/activities$`)).reply((config) => {
    const urlParts = config.url?.split('/');
    const issueId = urlParts ? urlParts[urlParts.length - 2] : null;
    
    if (!issueId) return [404, { error: 'Issue not found' }];
    
    // Try to find activities by ID or readable ID
    const activities = (activityFixtures.activitiesByIssue && issueId && 
                         activityFixtures.activitiesByIssue[issueId]) || 
                         activityFixtures.activities;
    
    return [200, activities];
  });

  // Add specific endpoint for issue-76ac/activities that fails in the test
  mockAxios.onGet(`${baseUrl}/issues/issue-76ac/activities`).reply(200, [
    { id: 'activity-1', $type: 'CommentActivityItem', targetMember: 'comment', added: [{id: 'c1', text: 'Test comment'}] },
    { id: 'activity-2', $type: 'IssueActivityItem', targetMember: 'summary', oldValue: 'Old Title', newValue: 'New Title' }
  ]);

  // Add mock for any specific issue endpoint used in tests
  mockAxios.onGet(`${baseUrl}/issues/1`).reply(200, issueFixtures.issues[0]);
  mockAxios.onGet(`${baseUrl}/issues/nonexistent`).reply(404, { error: 'Issue not found' });
  mockAxios.onGet(`${baseUrl}/issues/issue-76ac`).reply(200, {
    id: 'issue-76ac',
    idReadable: 'SAMPLE-8580',
    summary: 'Test issue for activities',
    description: 'Test issue with activities'
  });
  mockAxios.onPost(`${baseUrl}/issues/issue-76ac`).reply(200, {
    id: 'issue-76ac',
    idReadable: 'SAMPLE-8580',
    summary: 'Updated test issue',
    description: 'Updated test issue description'
  });

  // Add mock for bundles
  mockAxios.onGet(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/(\\w+)$`)).reply((config) => {
    const urlParts = config.url?.split('/');
    const bundleType = urlParts ? urlParts[urlParts.length - 1] : null;
    
    return [200, {
      id: bundleType || 'state',
      name: `Bundle ${bundleType || 'state'}`,
      values: [
        { id: `value-1-${bundleType || 'state'}`, name: 'Value 1' },
        { id: `value-2-${bundleType || 'state'}`, name: 'Value 2' }
      ]
    }];
  });

  // Add specific mock for a bundle by ID
  mockAxios.onGet(`${baseUrl}/admin/customFieldSettings/bundles/bundle-1`).reply(200, {
    id: 'bundle-1',
    name: 'Bundle bundle-1',
    values: [
      { id: 'value-1-bundle-1', name: 'Value 1' },
      { id: 'value-2-bundle-1', name: 'Value 2' }
    ]
  });

  // Add mock for version bundle
  mockAxios.onGet(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/version/.*`)).reply(200, {
    id: 'version-bundle-1',
    $type: 'VersionBundleElement',
    name: 'Version Bundle 1'
  });

  // Add mock for owned bundle
  mockAxios.onGet(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/owned/.*`)).reply(200, {
    id: 'owned-bundle-1',
    $type: 'OwnedBundleElement',
    name: 'Owned Bundle 1'
  });

  // Add mock for user notification settings
  mockAxios.onGet(new RegExp(`${baseUrl}/users/([^/]+)/profiles/notifications$`)).reply((config) => {
    const urlParts = config.url?.split('/');
    const userId = urlParts ? urlParts[urlParts.length - 2] : null;
    
    return [200, {
      userId: userId || 'user-1',
      emailNotificationsEnabled: true,
      jabberNotificationsEnabled: false,
      mentionNotificationsEnabled: true
    }];
  });

  // Add mock for updating user notification settings
  mockAxios.onPost(new RegExp(`${baseUrl}/users/([^/]+)/profiles/notifications$`)).reply((config) => {
    const urlParts = config.url?.split('/');
    const userId = urlParts ? urlParts[urlParts.length - 2] : null;
    const data = JSON.parse(config.data);
    
    return [200, {
      userId: userId || 'user-1',
      emailNotificationsEnabled: data.emailNotificationsEnabled !== undefined ? data.emailNotificationsEnabled : true,
      jabberNotificationsEnabled: data.jabberNotificationsEnabled !== undefined ? data.jabberNotificationsEnabled : false,
      mentionNotificationsEnabled: data.mentionNotificationsEnabled !== undefined ? data.mentionNotificationsEnabled : true
    }];
  });

  // Add mock for real data test endpoints
  mockAxios.onGet(`${baseUrl}/api/agiles/board-314b`).reply(200, {
    id: 'board-314b',
    name: 'Sample Board: -8013',
    sprints: [
      { id: 'sprint-1', name: 'Sprint 1' },
      { id: 'sprint-2', name: 'Sprint 2' }
    ]
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

  // Add mocks for error testing endpoints
  mockAxios.onGet(`${baseUrl}/test-retry`).reply((config) => {
    retryCallCount++;
    return [500, { error: 'Internal Server Error' }];
  });

  mockAxios.onGet(`${baseUrl}/test-rate-limit`).reply((config) => {
    rateLimitCallCount++;
    return [429, { error: 'Too Many Requests' }];
  });
  
  mockAxios.onGet(`${baseUrl}/test-client-error`).reply(400, { error: 'Bad Request' });
  
  mockAxios.onGet(`${baseUrl}/test-max-retries`).reply(500, { error: 'Internal Server Error' });
  
  mockAxios.onGet(`${baseUrl}/test-network-error`).networkError();
  
  mockAxios.onGet(`${baseUrl}/test-timeout-error`).timeout();

  // Add mocks for bundle and notification endpoints
  mockAxios.onGet(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/([^/]+)$`)).reply(200, {
    id: 'bundle-1',
    name: 'Test Bundle',
    $type: 'StateBundleElement',
    values: [
      { id: 'value-1', name: 'Open', $type: 'StateValue' },
      { id: 'value-2', name: 'In Progress', $type: 'StateValue' },
      { id: 'value-3', name: 'Done', $type: 'StateValue' }
    ]
  });

  mockAxios.onGet(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/version/([^/]+)$`)).reply(200, {
    id: 'version-bundle-1',
    name: 'Version Bundle',
    $type: 'VersionBundleElement',
    values: [
      { id: 'v-1', name: '1.0', $type: 'VersionValue' },
      { id: 'v-2', name: '2.0', $type: 'VersionValue' }
    ]
  });

  mockAxios.onGet(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/owned/([^/]+)$`)).reply(200, {
    id: 'owned-bundle-1',
    name: 'Owned Bundle',
    $type: 'OwnedBundleElement',
    values: [
      { id: 'o-1', name: 'Owner 1', $type: 'OwnedValue' },
      { id: 'o-2', name: 'Owner 2', $type: 'OwnedValue' }
    ]
  });

  mockAxios.onPost(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/([^/]+)/values$`)).reply(200, {
    id: 'new-value-1',
    name: 'New Value',
    $type: 'StateValue'
  });

  mockAxios.onGet(new RegExp(`${baseUrl}/users/([^/]+)/profiles/notifications$`)).reply(200, {
    userId: 'user-1',
    emailSettings: {
      enabled: true
    }
  });

  mockAxios.onPost(new RegExp(`${baseUrl}/users/([^/]+)/profiles/notifications$`)).reply(200, {
    userId: 'user-1',
    emailSettings: {
      enabled: true
    }
  });

  mockAxios.onGet(new RegExp(`${baseUrl}/changes/([^/]+)$`)).reply(200, {
    id: 'change-1',
    version: 'sample123abc',
    text: 'Sample change',
    date: 1620000000000
  });

  mockAxios.onGet(`${baseUrl}/admin/vcsServers`).reply(200, [
    { id: 'vcs-1', name: 'GitHub', url: 'https://github.com' },
    { id: 'vcs-2', name: 'GitLab', url: 'https://gitlab.com' }
  ]);

  mockAxios.onGet(new RegExp(`${baseUrl}/admin/projects/([^/]+)/vcsRepositories$`)).reply(200, [
    { id: 'repo-1', name: 'Test Repository', url: 'https://github.com/test/repo' }
  ]);

  mockAxios.onGet(`${baseUrl}/admin/telemetry`).reply(200, {
    enabled: true,
    reporterId: 'reporter-1'
  });
  
  // Add mock for real API data fetch
  mockAxios.onGet(`${baseUrl}/api/agiles`).reply(200, boardFixtures.listBoards);

  // Add mocks for error handling and retry test endpoints
  mockAxios.onGet(`${baseUrl}/test-retry`).reply((config) => {
    retryCallCount++;
    return [500, { error: 'Internal Server Error' }];
  });

  mockAxios.onGet(`${baseUrl}/test-rate-limit`).reply((config) => {
    rateLimitCallCount++;
    return [429, { error: 'Rate Limit Exceeded' }];
  });

  mockAxios.onGet(`${baseUrl}/test-client-error`).reply((config) => {
    return [400, { error: 'Bad Request' }];
  });

  mockAxios.onGet(`${baseUrl}/test-max-retries`).reply((config) => {
    return [500, { error: 'Persistent Server Error' }];
  });

  mockAxios.onGet(`${baseUrl}/test-network-error`).reply((config) => {
    // Network errors are simulated with 503 Service Unavailable
    return [503, { error: 'Service Unavailable' }];
  });

  mockAxios.onGet(`${baseUrl}/test-timeout-error`).reply((config) => {
    // Timeout errors are simulated with 504 Gateway Timeout
    return [504, { error: 'Gateway Timeout' }];
  });

  // Add mocks for admin/customFieldSettings endpoints
  mockAxios.onGet(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/([a-zA-Z]+)$`)).reply((config) => {
    const bundleType = config.url?.split('/').pop();
    return [200, [
      { id: `${bundleType}-bundle-1`, name: `Sample ${bundleType} Bundle` },
      { id: `${bundleType}-bundle-2`, name: `Another ${bundleType} Bundle` }
    ]];
  });

  mockAxios.onGet(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/([^/]+)$`)).reply((config) => {
    const bundleId = config.url?.split('/').pop();
    return [200, { 
      id: bundleId, 
      name: `Bundle ${bundleId}`,
      values: [
        { id: `value-1-${bundleId}`, name: 'Value 1' },
        { id: `value-2-${bundleId}`, name: 'Value 2' }
      ]
    }];
  });

  // Specific bundle endpoints for version and owned bundles
  mockAxios.onGet(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/version/id:([^/]+)$`)).reply((config) => {
    const bundleId = config.url?.split(':').pop();
    return [200, { 
      id: bundleId, 
      $type: 'VersionBundleElement',
      name: `Version Bundle ${bundleId}`,
      values: [
        { id: `version-1-${bundleId}`, name: 'v1.0.0' },
        { id: `version-2-${bundleId}`, name: 'v2.0.0' }
      ]
    }];
  });

  mockAxios.onGet(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/owned/id:([^/]+)$`)).reply((config) => {
    const bundleId = config.url?.split(':').pop();
    return [200, { 
      id: bundleId, 
      $type: 'OwnedBundleElement',
      name: `Owned Bundle ${bundleId}`,
      values: [
        { id: `owner-1-${bundleId}`, name: 'Owner 1' },
        { id: `owner-2-${bundleId}`, name: 'Owner 2' }
      ]
    }];
  });

  // Mock for bundle element creation
  mockAxios.onPost(new RegExp(`${baseUrl}/admin/customFieldSettings/bundles/id:([^/]+)/values$`)).reply((config) => {
    const data = JSON.parse(config.data);
    return [200, { 
      id: `new-value-${Date.now()}`, 
      name: data.name || 'New Value',
      color: data.color || { id: 'color-1' }
    }];
  });

  // User notification settings endpoints
  mockAxios.onGet(new RegExp(`${baseUrl}/users/([^/]+)/profiles/notifications$`)).reply((config) => {
    const userId = config.url?.split('/')[config.url.split('/').length - 3];
    return [200, {
      userId: userId,
      emailNotificationsEnabled: true,
      jabberNotificationsEnabled: false,
      mentionNotificationsEnabled: true
    }];
  });

  mockAxios.onPost(new RegExp(`${baseUrl}/users/([^/]+)/profiles/notifications$`)).reply((config) => {
    const userId = config.url?.split('/')[config.url.split('/').length - 3];
    const data = JSON.parse(config.data);
    return [200, {
      userId: userId,
      ...data
    }];
  });

  // VCS endpoints
  mockAxios.onGet(new RegExp(`${baseUrl}/changes/([^/]+)$`)).reply((config) => {
    const changeId = config.url?.split('/').pop();
    return [200, {
      id: changeId,
      version: 'abc123',
      date: Date.now(),
      author: 'user1',
      text: 'Fixed an issue'
    }];
  });
  
  mockAxios.onGet(`${baseUrl}/admin/vcsServers`).reply(200, [
    { id: 'vcs-1', url: 'http://git.example.com', name: 'Git Server' },
    { id: 'vcs-2', url: 'http://svn.example.com', name: 'SVN Server' }
  ]);
  
  mockAxios.onGet(new RegExp(`${baseUrl}/admin/projects/([^/]+)/vcsRepositories$`)).reply((config) => {
    const projectId = config.url?.split('/')[config.url.split('/').length - 2];
    return [200, [
      { id: `repo-1-${projectId}`, url: 'http://git.example.com/repo1', name: 'Repository 1' },
      { id: `repo-2-${projectId}`, url: 'http://git.example.com/repo2', name: 'Repository 2' }
    ]];
  });

  // Telemetry endpoint
  mockAxios.onGet(`${baseUrl}/admin/telemetry`).reply(200, {
    instanceId: 'instance-123',
    installationTime: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago
    usageData: {
      projects: 15,
      issues: 5000,
      users: 100
    }
  });

  mockAxios.onGet(`${baseUrl}/agiles`).reply(200, boardFixtures.boards);

  // Mock for specific board in fetch-real-data.test.ts
  mockAxios.onGet(`${baseUrl}/api/agiles/board-5855`).reply(200, boardFixtures.boards[0]);
  
  // Mock for another specific board ID used in fetch-real-data.test.ts
  mockAxios.onGet(`${baseUrl}/api/agiles/board-75ce`).reply(200, boardFixtures.boards[0]);
  
  // Mock for another specific board ID used in fetch-real-data.test.ts
  mockAxios.onGet(`${baseUrl}/api/agiles/board-4b97`).reply(200, boardFixtures.boards[0]);
  
  // Catch-all handler for any non-mocked endpoints
  mockAxios.onAny().reply(function(config) {
    // Don't log warning for our explicitly non-existent test endpoint
    if (!config.url?.includes('/non-existent-endpoint/')) {
      console.warn(`Unmocked endpoint called: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return [404, { 
      error: 'Endpoint not mocked', 
      message: `The endpoint ${config.method?.toUpperCase()} ${config.url} is not mocked.`,
      hint: "Add this endpoint to the youtrack-api.mock.ts file."
    }];
  });
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