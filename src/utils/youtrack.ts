
import axios, { AxiosError } from 'axios';
import { FieldBuilder } from './field-builder';
import * as YouTrackTypes from '../types/youtrack';

/**
 * YouTrack class for interacting with the YouTrack REST API
 */
export class YouTrack {
  private baseUrl: string;
  private token: string;
  private defaultHeaders: Record<string, string>;
  private debug: boolean;
  
  // Field builders
  public static readonly DEFAULT_ISSUE_FIELDS = 'id,idReadable,Stage,summary,description,created,updated,resolved,numberInProject,$type,project($type,id,name),reporter($type,id,login,ringId,name),updater($type,id,login),customFields($type,id,name,projectCustomField(id,field(id,name)),value($type,id,name,isResolved,fullName,login,avatarUrl,color(id))),links($type,direction,id,linkType($type,id,localizedName)),visibility($type,id,permittedGroups($type,id,name),permittedUsers($type,id,login)),comments($type,id,text,author($type,id,login),created)';
  public static readonly DEFAULT_SPRINT_FIELDS = `id,name,goal,start,finish,archived,isDefault,unresolvedIssuesCount,issues(id,idReadable,projectCustomField(id,field(id,name))`;
  public static readonly DEFAULT_AGILE_FIELDS = `id,name,description,start,finish,isDefault,isCompleted,issues(id,idReadable,projectCustomField(id,field(id,name)))`;
  private issueFieldBuilder = new FieldBuilder(YouTrack.DEFAULT_ISSUE_FIELDS);
  private sprintFieldBuilder = new FieldBuilder(YouTrack.DEFAULT_SPRINT_FIELDS);
  private agileFieldBuilder = new FieldBuilder(YouTrack.DEFAULT_AGILE_FIELDS);
  
  // Field getters
  public get issueFields(): string {
    return this.issueFieldBuilder.build();
  }
  
  public get sprintFields(): string {
    return this.sprintFieldBuilder.build();
  }
  
  public get agileFields(): string {
    return this.agileFieldBuilder.build();
  }

  /**
   * Create a new YouTrack instance
   * @param baseUrl - The base URL of the YouTrack instance
   * @param token - The permanent token for authorization
   * @param debug - Enable debug logging for requests and responses
   */
  constructor(baseUrl: string, token: string, debug = false) {
    // Ensure the base URL doesn't end with a slash
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.baseUrl = this.baseUrl.includes('/api') ? this.baseUrl : `${this.baseUrl}/api`;
    this.token = token;
    this.debug = debug;
    this.defaultHeaders = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'axios/1.9.0',
      'Accept-Encoding': 'gzip, compress, deflate, br',
    };
  }

  /**
   * Add fields to the issue field builder
   * @param fields - Fields to add (can be dot-notation paths)
   * @returns this instance for chaining
   */
  public addIssueFields(fields: string | string[]): YouTrack {
    const fieldList = Array.isArray(fields) ? fields : [fields];
    fieldList.forEach(field => this.issueFieldBuilder.add(field));
    return this;
  }

  /**
   * Add fields to the sprint field builder
   * @param fields - Fields to add (can be dot-notation paths)
   * @returns this instance for chaining
   */
  public addSprintFields(fields: string | string[]): YouTrack {
    const fieldList = Array.isArray(fields) ? fields : [fields];
    fieldList.forEach(field => this.sprintFieldBuilder.add(field));
    return this;
  }

  /**
   * Add fields to the agile board field builder
   * @param fields - Fields to add (can be dot-notation paths)
   * @returns this instance for chaining
   */
  public addAgileFields(fields: string | string[]): YouTrack {
    const fieldList = Array.isArray(fields) ? fields : [fields];
    fieldList.forEach(field => this.agileFieldBuilder.add(field));
    return this;
  }

  /**
   * Reset the issue field builder to a new set of fields
   * @param fields - Fields to set (can be dot-notation paths)
   * @returns this instance for chaining
   */
  public setIssueFields(fields: string[]): YouTrack {
    this.issueFieldBuilder = new FieldBuilder().addFields(fields);
    return this;
  }

  /**
   * Reset the sprint field builder to a new set of fields
   * @param fields - Fields to set (can be dot-notation paths)
   * @returns this instance for chaining
   */
  public setSprintFields(fields: string[]): YouTrack {
    this.sprintFieldBuilder = new FieldBuilder().addFields(fields);
    return this;
  }

  /**
   * Reset the agile field builder to a new set of fields
   * @param fields - Fields to set (can be dot-notation paths)
   * @returns this instance for chaining
   */
  public setAgileFields(fields: string[]): YouTrack {
    this.agileFieldBuilder = new FieldBuilder().addFields(fields);
    return this;
  }

  /**
   * Make a request to the YouTrack API
   * @param endpoint - The API endpoint to call
   * @param options - Request options
   * @returns The response data
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
      params?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, headers = {}, params = {} } = options;

    // Construct the URL
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Merge headers
    const requestHeaders = { ...this.defaultHeaders, ...headers };
    
    // Debug logging - Request
    if (this.debug) {
      console.log(`\n==== YouTrack API Request ====`);
      console.log(`${method} ${url}`);
      console.log(`Headers:`, JSON.stringify(requestHeaders, null, 2));
      if (body) {
        console.log(`Body:`, JSON.stringify(body, null, 2));
      }
      console.log(`Params:`, JSON.stringify(params, null, 2));
      console.log(`==== End Request ====\n`);
    }

    try {
      const startTime = Date.now();
      
      // Make the axios request
      const response = await axios({
        method,
        url,
        headers: requestHeaders,
        params,
        data: body,
        validateStatus: () => true, // Don't throw on any status code, we'll handle it ourselves
      });
      
      const endTime = Date.now();
      
      // Debug logging - Response
      if (this.debug) {
        console.log(`\n==== YouTrack API Response ====`);
        console.log(`${method} ${url}`);
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Time: ${endTime - startTime}ms`);
        console.log(`Headers:`, JSON.stringify(response.headers, null, 2));
      }

      // Handle non-2XX responses
      if (response.status < 200 || response.status >= 300) {
        const errorText = typeof response.data === 'string' 
          ? response.data 
          : JSON.stringify(response.data);
          
        if (this.debug) {
          console.log(`Error Body: ${errorText}`);
          console.log(`==== End Response (Error) ====\n`);
        }
        
        throw new Error(
          `YouTrack API Error (${response.status}): ${errorText}`
        );
      }

      // Process response data
      const responseData = response.data as T;
      
      if (this.debug) {
        if (responseData !== null && typeof responseData === 'object') {
          console.log(`Body:`, JSON.stringify(responseData, null, 2));
        } else if (typeof responseData === 'string') {
          console.log(`Body (text): ${responseData.substring(0, 1000)}${responseData.length > 1000 ? '...' : ''}`);
        } else {
          console.log(`Body: ${responseData}`);
        }
        console.log(`==== End Response ====\n`);
      }
      
      return responseData;
    } catch (error) {
      if (this.debug) {
        console.error(`\n==== YouTrack API Error ====`);
        console.error(`${method} ${url}`);
        console.error(`Error:`, error);
        console.error(`==== End Error ====\n`);
      }
      
      if (error instanceof AxiosError && error.response) {
        throw new Error(
          `YouTrack API Error (${error.response.status}): ${
            typeof error.response.data === 'string' 
              ? error.response.data 
              : JSON.stringify(error.response.data)
          }`
        );
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(`YouTrack API request failed: ${String(error)}`);
    }
  }

  // ======= ISSUES =======

  /**
   * Get an issue by ID
   * @param issueId - The ID of the issue
   * @returns The issue data
   */
  async getIssue(issueId: string): Promise<YouTrackTypes.Issue> {
    return this.request<YouTrackTypes.Issue>(`/issues/${issueId}`, {
      params: {
        fields: this.issueFields,
      },
    });
  }

  /**
   * Update an issue
   * @param issueId - The ID of the issue
   * @param data - The data to update
   * @returns The updated issue
   */
  async updateIssue(
    issueId: string,
    data: { summary?: string; description?: string; resolved?: boolean }
  ): Promise<YouTrackTypes.Issue> {
    return this.request<YouTrackTypes.Issue>(`/issues/${issueId}`, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Search for issues using YouTrack query syntax
   * @param query - The search query
   * @param options - Search options
   * @returns The search results
   */
  async searchIssues(
    query: string,
    options: { limit?: number; sortBy?: string } = {}
  ): Promise<YouTrackTypes.Issue[]> {
    const { limit = 50, sortBy } = options;

    const params: Record<string, string> = {
      query,
      $top: limit.toString(),
      fields: this.issueFields,
    };

    // Only add $orderBy if sortBy is defined
    if (sortBy) {
      params.$orderBy = sortBy;
    }

    return this.request<YouTrackTypes.Issue[]>('/issues', { params });
  }

  /**
   * Find issues by specific criteria
   * @param criteria - The search criteria
   * @returns The matching issues
   */
  async findIssuesByCriteria(criteria: {
    project?: string;
    assignee?: string;
    sprint?: string;
    status?: string;
    type?: string;
    limit?: number;
  }): Promise<YouTrackTypes.Issue[]> {
    const { project, assignee, sprint, status, type, limit = 50 } = criteria;

    // Build query from criteria
    let query = '';

    if (project) query += `project: ${project} `;
    if (assignee) {
      if (assignee.toLowerCase() === 'me') {
        query += 'for: me ';
      } else {
        query += `for: ${assignee} `;
      }
    }
    if (sprint) query += `sprint: ${sprint} `;
    if (status) query += `State: ${status} `;
    if (type) query += `Type: ${type} `;

    return this.searchIssues(query.trim(), { limit });
  }

  /**
   * Get issue attachments
   * @param issueId - The ID of the issue
   * @returns The issue attachments
   */
  async getIssueAttachments(issueId: string): Promise<YouTrackTypes.IssueAttachment[]> {
    return this.request<YouTrackTypes.IssueAttachment[]>(`/issues/${issueId}/attachments`, {
      params: {
        fields:
          'id,name,url,created,author(id,name),size,mimeType,thumbnailURL',
      },
    });
  }

  /**
   * Add attachment to issue
   * @param issueId - The ID of the issue
   * @param fileName - The name of the file
   * @param fileContent - The content of the file
   * @param contentType - The content type of the file
   * @returns The created attachment
   */
  async addIssueAttachment(
    issueId: string,
    fileName: string,
    fileContent: Blob | File,
    contentType?: string
  ): Promise<YouTrackTypes.IssueAttachment> {
    const formData = new FormData();
    formData.append('file', fileContent, fileName);

    return this.request<YouTrackTypes.IssueAttachment>(`/issues/${issueId}/attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      },
      body: formData,
    });
  }

  /**
   * Add comment to issue
   * @param issueId - The ID of the issue
   * @param text - The comment text
   * @returns The created comment
   */
  async addIssueComment(issueId: string, text: string): Promise<YouTrackTypes.IssueComment> {
    return this.request<YouTrackTypes.IssueComment>(`/issues/${issueId}/comments`, {
      method: 'POST',
      body: { text },
    });
  }

  /**
   * Get issue comments
   * @param issueId - The ID of the issue
   * @returns The issue comments
   */
  async getIssueComments(issueId: string): Promise<YouTrackTypes.IssueComment[]> {
    return this.request<YouTrackTypes.IssueComment[]>(`/issues/${issueId}/comments`, {
      params: { fields: 'id,text,created,updated,author(id,name)' },
    });
  }

  /**
   * Get issue links
   * @param issueId - The ID of the issue
   * @returns The issue links
   */
  async getIssueLinks(issueId: string): Promise<YouTrackTypes.IssueLink[]> {
    return this.request<YouTrackTypes.IssueLink[]>(`/issues/${issueId}/links`, {
      params: {
        fields:
          'id,direction,linkType(id,name,sourceToTarget,targetToSource),issues(id,summary)',
      },
    });
  }

  /**
   * Create a new issue
   * @param projectId - The ID of the project
   * @param data - The issue data
   * @returns The created issue
   */
  async createIssue(
    projectId: string,
    data: {
      summary: string;
      description?: string;
      customFields?: Array<{ name: string; value: string | string[] }>;
    }
  ): Promise<YouTrackTypes.Issue> {
    return this.request<YouTrackTypes.Issue>('/issues', {
      method: 'POST',
      body: { ...data, project: { id: projectId } },
    });
  }

  // ======= PROJECTS =======

  /**
   * List all available projects
   * @returns Array of projects
   */
  async listProjects(): Promise<YouTrackTypes.Project[]> {
    return this.request<YouTrackTypes.Project[]>('/admin/projects', {
      params: { fields: 'id,name,shortName,description' },
    });
  }

  // ======= AGILE BOARDS =======

  /**
   * List all available agile boards
   * @returns Array of agile boards
   */
  async listBoards(): Promise<YouTrackTypes.Board[]> {
    return this.request<YouTrackTypes.Board[]>('/agiles', {
      params: {
        fields: 'id,name,projects(id,name),sprints(id,name,start,finish)',
      },
    });
  }

  /**
   * Get details of a specific agile board
   * @param boardId - The ID of the agile board
   * @returns The agile board data
   */
  async getBoard(boardId: string): Promise<YouTrackTypes.Board> {
    return this.request<YouTrackTypes.Board>(`/agiles/${boardId}`, {
      params: {
        fields: this.agileFields,
      },
    });
  }

  // ======= SPRINTS =======

  /**
   * Get details of a specific sprint
   * @param boardId - The ID of the agile board
   * @param sprintId - The ID of the sprint
   * @returns The sprint data
   */
  async getSprint(boardId: string, sprintId: string): Promise<YouTrackTypes.Sprint> {
    return this.request<YouTrackTypes.Sprint>(`/agiles/${boardId}/sprints/${sprintId}`, {
      params: {
        fields: this.sprintFields,
      },
    });
  }

  /**
   * Find sprints by board, name, or status
   * @param options - Search options
   * @returns The matching sprints
   */
  async findSprints(options: {
    boardId?: string;
    sprintName?: string;
    status?: 'active' | 'archived' | 'all';
    limit?: number;
  }): Promise<YouTrackTypes.Sprint[]> {
    const { boardId, sprintName, status = 'all', limit = 50 } = options;

    if (!boardId) {
      throw new Error('boardId is required to find sprints');
    }

    const sprints = await this.request<YouTrackTypes.Sprint[]>(`/agiles/${boardId}/sprints`, {
      params: {
        fields: 'id,name,start,finish,isCompleted',
        $top: limit.toString(),
      },
    });

    if (!sprints) return [];

    // Filter by name if provided
    let filteredSprints = sprints;
    if (sprintName) {
      filteredSprints = filteredSprints.filter((sprint) =>
        sprint.name.toLowerCase().includes(sprintName.toLowerCase())
      );
    }

    // Filter by status if not 'all'
    if (status !== 'all') {
      const isArchived = status === 'archived';
      filteredSprints = filteredSprints.filter(
        (sprint) => sprint.isCompleted === isArchived
      );
    }

    return filteredSprints;
  }

  // ======= VCS CHANGES =======

  /**
   * Get VCS changes for an issue
   * @param issueId - The ID of the issue
   * @returns Array of VCS changes
   */
  async getVcsChanges(issueId: string): Promise<YouTrackTypes.VcsChange[]> {
    return this.request<YouTrackTypes.VcsChange[]>(`/issues/${issueId}/changes`, {
      params: { fields: 'id,date,text,author(id,name),version' },
    });
  }

  /**
   * Get a specific VCS change
   * @param changeId - The ID of the VCS change
   * @returns The VCS change data
   */
  async getVcsChange(changeId: string): Promise<YouTrackTypes.VcsChange> {
    return this.request<YouTrackTypes.VcsChange>(`/changes/${changeId}`, {
      params: { fields: 'id,date,text,author(id,name),version,files' },
    });
  }

  /**
   * List VCS servers configured in YouTrack
   * @returns Array of VCS servers
   */
  async listVcsServers(): Promise<YouTrackTypes.VcsServer[]> {
    return this.request<YouTrackTypes.VcsServer[]>('/admin/vcsServers', {
      params: { fields: 'id,url,$type' },
    });
  }

  /**
   * Get VCS hosting processors
   * @param projectId - The ID of the project
   * @returns Array of VCS hosting processors
   */
  async getVcsProcessors(
    projectId: string
  ): Promise<YouTrackTypes.VcsHostingChangesProcessor[]> {
    return this.request<YouTrackTypes.VcsHostingChangesProcessor[]>(
      `/admin/projects/${projectId}/vcsRepositories`,
      {
        params: {
          fields: 'id,server(id,url),path,branchSpecification,enabled',
        },
      }
    );
  }

  // ======= BUNDLES =======

  /**
   * List bundles of a specific type
   * @param bundleType - The type of bundle to list
   * @returns Array of bundles
   */
  async listBundles(bundleType: string): Promise<YouTrackTypes.Bundle[]> {
    return this.request<YouTrackTypes.Bundle[]>(
      `/admin/customFieldSettings/bundles/${bundleType}`,
      {
        params: { fields: 'id,name' },
      }
    );
  }

  /**
   * Get a specific bundle
   * @param bundleId - The ID of the bundle
   * @returns The bundle data
   */
  async getBundle(bundleId: string): Promise<YouTrackTypes.Bundle> {
    return this.request<YouTrackTypes.Bundle>(
      `/admin/customFieldSettings/bundles/id:${bundleId}`,
      {
        params: {
          fields: 'id,name,values(id,name,description,archived,color)',
        },
      }
    );
  }

  /**
   * Get elements from a bundle
   * @param bundleId - The ID of the bundle
   * @returns Array of bundle elements
   */
  async getBundleElements(bundleId: string): Promise<YouTrackTypes.BundleElement[]> {
    const bundle = await this.getBundle(bundleId);
    return bundle.values || [];
  }

  /**
   * Create a new bundle element
   * @param bundleId - The ID of the bundle
   * @param data - The element data
   * @returns The created bundle element
   */
  async createBundleElement(
    bundleId: string,
    data: { name: string; description?: string }
  ): Promise<YouTrackTypes.BundleElement> {
    return this.request<YouTrackTypes.BundleElement>(
      `/admin/customFieldSettings/bundles/id:${bundleId}/values`,
      {
        method: 'POST',
        body: data,
      }
    );
  }

  /**
   * Get version bundle
   * @param bundleId - The ID of the version bundle
   * @returns The version bundle data
   */
  async getVersionBundle(bundleId: string): Promise<YouTrackTypes.VersionBundle> {
    return this.request<YouTrackTypes.VersionBundle>(
      `/admin/customFieldSettings/bundles/version/id:${bundleId}`,
      {
        params: {
          fields:
            'id,name,values(id,name,description,archived,releaseDate,released)',
        },
      }
    );
  }

  /**
   * Get owned bundle
   * @param bundleId - The ID of the owned bundle
   * @returns The owned bundle data
   */
  async getOwnedBundle(bundleId: string): Promise<YouTrackTypes.OwnedBundle> {
    return this.request<YouTrackTypes.OwnedBundle>(
      `/admin/customFieldSettings/bundles/owned/id:${bundleId}`,
      {
        params: {
          fields: 'id,name,values(id,name,description,archived,owner(id,name))',
        },
      }
    );
  }

  // ======= USER SETTINGS =======

  /**
   * Get notification settings for a user
   * @param userId - The ID of the user
   * @returns The user's notification settings
   */
  async getUserNotificationSettings(
    userId: string
  ): Promise<YouTrackTypes.NotificationsUserProfile> {
    return this.request<YouTrackTypes.NotificationsUserProfile>(
      `/users/${userId}/profiles/notifications`,
      {
        params: {
          fields:
            'id,notifyOnOwnChanges,emailNotificationsEnabled,mentionNotificationsEnabled,autoWatchOnComment,autoWatchOnCreate',
        },
      }
    );
  }

  /**
   * Update notification settings for a user
   * @param userId - The ID of the user
   * @param settings - The settings to update
   * @returns The updated notification settings
   */
  async updateUserNotificationSettings(
    userId: string,
    settings: Partial<YouTrackTypes.NotificationsUserProfile>
  ): Promise<YouTrackTypes.NotificationsUserProfile> {
    return this.request<YouTrackTypes.NotificationsUserProfile>(
      `/users/${userId}/profiles/notifications`,
      {
        method: 'POST',
        body: settings,
      }
    );
  }

  // ======= SYSTEM =======

  /**
   * Get system telemetry data
   * @returns The telemetry data
   */
  async getTelemetryData(): Promise<YouTrackTypes.TelemetryData> {
    return this.request<YouTrackTypes.TelemetryData>('/admin/telemetry', {
      params: {
        fields:
          'id,availableProcessors,availableMemory,usedMemory,uptime,databaseSize,onlineUsers(users)',
      },
    });
  }
}
