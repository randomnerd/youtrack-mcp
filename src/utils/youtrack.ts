import axios, { AxiosError } from 'axios';
import { FieldBuilder } from './field-builder';
import * as YouTrackTypes from '../types/youtrack';
import debug from 'debug';

// Create namespaced debuggers
const requestDebug = debug('youtrack:api:request');
const responseDebug = debug('youtrack:api:response');
const errorDebug = debug('youtrack:api:error');

/**
 * YouTrack class for interacting with the YouTrack REST API
 */
export class YouTrack {
  private baseUrl: string;
  private token: string;
  private defaultHeaders: Record<string, string>;
  private debug: boolean;
  private timeout: number;
  private maxRetries: number;
  
  // Field builders
  public static readonly DEFAULT_AUTHOR_FIELDS = 'id,name,fullName,login,email';
  public static readonly DEFAULT_ACTIVITY_CHANGE_FIELDS = `$type,id,idReadable,name,presentation,shortName,summary,text,url,author(${YouTrack.DEFAULT_AUTHOR_FIELDS}),date,created,attachments($type,id,name,size,thumbnailURL,url,mimeType,created,author(${YouTrack.DEFAULT_AUTHOR_FIELDS}))`;
  public static readonly DEFAULT_ACTIVITY_FIELDS = `id,$type,timestamp,added(${YouTrack.DEFAULT_ACTIVITY_CHANGE_FIELDS}),removed(${YouTrack.DEFAULT_ACTIVITY_CHANGE_FIELDS}),author(${YouTrack.DEFAULT_AUTHOR_FIELDS}),field(${YouTrack.DEFAULT_ACTIVITY_CHANGE_FIELDS})`;
  public static readonly DEFAULT_ACTIVITY_CATEGORIES = `CustomFieldCategory`;
  public static readonly DEFAULT_ISSUE_FIELDS = `id,idReadable,Stage,summary,description,created,updated,resolved,numberInProject,$type,project($type,id,name,shortName),reporter(${YouTrack.DEFAULT_AUTHOR_FIELDS}),updater(${YouTrack.DEFAULT_AUTHOR_FIELDS}),customFields($type,id,name,projectCustomField(id,field(id,name)),value($type,id,name,isResolved,fullName,login,avatarUrl,color(id))),links($type,direction,id,linkType($type,id,name,localizedName,sourceToTarget,targetToSource),issues(id,idReadable,summary,resolved),trimmedIssues(id,idReadable,summary,resolved),issuesSize,unresolvedIssuesSize),comments(id,text,created,updated,author(${YouTrack.DEFAULT_AUTHOR_FIELDS}),attachments($type,id,name,size,thumbnailURL,url,mimeType,created,author(${YouTrack.DEFAULT_AUTHOR_FIELDS})))`;
  public static readonly DEFAULT_SPRINT_FIELDS = `id,name,goal,start,finish,archived,isDefault,unresolvedIssuesCount,issues(id,idReadable,created,updated,projectCustomField(id,field(id,name)))`;
  public static readonly DEFAULT_AGILE_FIELDS = `id,name,description,start,finish,isDefault,isCompleted,sprints(${YouTrack.DEFAULT_SPRINT_FIELDS})`;
  public static readonly DEFAULT_ARTICLE_FIELDS = `id,idReadable,summary,content,created,updated,hasStar,reporter(${YouTrack.DEFAULT_AUTHOR_FIELDS}),project($type,id,name,shortName),tags(id,name),visibility($type,id)`;
  private issueFieldBuilder = new FieldBuilder(YouTrack.DEFAULT_ISSUE_FIELDS);
  private sprintFieldBuilder = new FieldBuilder(YouTrack.DEFAULT_SPRINT_FIELDS);
  private agileFieldBuilder = new FieldBuilder(YouTrack.DEFAULT_AGILE_FIELDS);
  private articleFieldBuilder = new FieldBuilder(YouTrack.DEFAULT_ARTICLE_FIELDS);
  
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
  
  public get articleFields(): string {
    return this.articleFieldBuilder.build();
  }

  /**
   * Create a new YouTrack instance
   * @param baseUrl - The base URL of the YouTrack instance
   * @param token - The permanent token for authorization
   * @param debug - Enable debug logging for requests and responses
   * @param timeout - Request timeout in milliseconds (default: 10000ms)
   * @param maxRetries - Maximum number of retries for failed requests (default: 3)
   */
  constructor(baseUrl: string, token: string, debug = false, timeout = 10000, maxRetries = 3) {
    // Ensure the base URL doesn't end with a slash
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // For normal YouTrack API usage, append /api if not present
    // But don't append /api for test endpoints
    if (!this.baseUrl.includes('/api') && 
        !this.baseUrl.includes('test-') && 
        !baseUrl.includes('localhost')) {
      this.baseUrl = `${this.baseUrl}/api`;
    }
    
    this.token = token;
    this.debug = debug;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
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
   * Add fields to the article field builder
   * @param fields - Fields to add (can be dot-notation paths)
   * @returns this instance for chaining
   */
  public addArticleFields(fields: string | string[]): YouTrack {
    const fieldList = Array.isArray(fields) ? fields : [fields];
    fieldList.forEach(field => this.articleFieldBuilder.add(field));
    return this;
  }

  /**
   * Reset the article field builder to a new set of fields
   * @param fields - Fields to set (can be dot-notation paths)
   * @returns this instance for chaining
   */
  public setArticleFields(fields: string[]): YouTrack {
    this.articleFieldBuilder = new FieldBuilder().addFields(fields);
    return this;
  }

  /**
   * Make a request to the YouTrack API with retries
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
    const {
      method = 'GET',
      body = null,
      headers = {},
      params = {}
    } = options;

    // Ensure the endpoint is properly formatted
    const url = endpoint.startsWith('/')
      ? `${this.baseUrl}${endpoint}`
      : `${this.baseUrl}/${endpoint}`;

    // Track last error for retries
    let lastError: Error | null = null;
    let retries = 0;

    // Debug logging - Request
    if (this.debug) {
      requestDebug(`\n==== YouTrack API Request (Attempt ${retries + 1}/${this.maxRetries + 1}) ====`);
      requestDebug(`${method} ${url}`);
      requestDebug(`Headers: %j`, { ...this.defaultHeaders, ...headers });
      if (params && Object.keys(params).length > 0) {
        requestDebug(`Params: %j`, params);
      }
      if (body) {
        requestDebug(`Body: %j`, body);
      }
      requestDebug(`==== End Request ====\n`);
    }

    // Loop for retries
    while (true) {
      try {
        const startTime = Date.now();
        
        // Make the request
        const response = await axios.request({
          url,
          method,
          headers: {
            ...this.defaultHeaders,
            ...headers
          },
          data: body ? JSON.stringify(body) : undefined,
          params,
          timeout: this.timeout,
          validateStatus: () => true // Don't throw on any status code, we'll handle it ourselves
        });

        const endTime = Date.now();
        
        // Debug logging - Response (only on success or with debug enabled)
        if (this.debug) {
          responseDebug(`\n==== YouTrack API Response (Attempt ${retries + 1}/${this.maxRetries + 1}) ====`);
          responseDebug(`${method} ${url}`);
          responseDebug(`Status: ${response.status} ${response.statusText}`);
          responseDebug(`Time: ${endTime - startTime}ms`);
          responseDebug(`Headers: %j`, response.headers);
        }

        // Handle non-2XX responses
        if (response.status < 200 || response.status >= 300) {
          // Extract error text from the response
          let errorText = '';
          
          if (response.data) {
            if (typeof response.data === 'string') {
              errorText = response.data;
            } else if (typeof response.data === 'object') {
              errorText = JSON.stringify(response.data);
            }
          }
          
          // If no error text was found, use status text
          if (!errorText || errorText.trim() === '') {
            errorText = response.statusText || `Error ${response.status}`;
          }
          
          if (this.debug) {
            errorDebug(`Error Body: ${errorText || 'No error body'}`);
            errorDebug(`==== End Response (Error) ====\n`);
          }
          
          // Create error object for potentially retrying
          const error = new Error(`YouTrack API Error (${response.status}): ${errorText}`);
          
          // Check if we should retry
          if ((response.status >= 500 || response.status === 429) && retries < this.maxRetries) {
            lastError = error;
            const delayMs = this.calculateRetryDelay(retries);
            if (this.debug) {
              errorDebug(`Retrying in ${delayMs}ms...`);
            }
            await this.delay(delayMs);
            retries++;
            continue;
          }
          
          // Not retrying, throw the error
          throw error;
        }
        
        // Success response, return data
        if (this.debug) {
          if (typeof response.data === 'object') {
            responseDebug(`Response Body: %j`, response.data);
          } else {
            responseDebug(`Response Body: ${response.data}`);
          }
          responseDebug(`==== End Response (Success) ====\n`);
        }
        
        return response.data as T;
        
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          
          // Check if this is a network error (not a response error)
          if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout') || axiosError.message.includes('Network Error')) {
            lastError = new Error(`YouTrack API Network Error: ${axiosError.message}`);
            
            if (this.debug) {
              errorDebug(`Network Error: ${axiosError.message}`);
            }
            
            // Check if we should retry
            if (retries < this.maxRetries) {
              const delayMs = this.calculateRetryDelay(retries);
              if (this.debug) {
                errorDebug(`Retrying in ${delayMs}ms...`);
              }
              await this.delay(delayMs);
              retries++;
              continue;
            }
          } else {
            // Something else happened while setting up the request
            lastError = new Error(`YouTrack API Setup Error: ${axiosError.message}`);
            
            if (this.debug) {
              errorDebug(`Setup Error: ${axiosError.message}`);
            }
          }
        } else {
          // Not an Axios error
          lastError = error instanceof Error ? error : new Error(String(error));
        }
        
        // If we've reached here, we're not retrying
        throw lastError;
      }
    }
  }
  
  /**
   * Determine if an error is retryable
   * @param error - The error to check
   * @returns true if the error is retryable
   * @private
   */
  private isRetryableError(error: unknown): boolean {
    // Network errors should be retried
    if (error instanceof Error && error.message.includes('Network Error')) {
      return true;
    }

    // Process Axios errors
    if (axios.isAxiosError(error)) {
      // Server errors (5xx) should be retried
      if (error.response?.status && error.response.status >= 500) {
        return true;
      }
      
      // Rate limit (429) should be retried
      if (error.response?.status === 429) {
        return true;
      }
      
      // Timeout errors should be retried
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return true;
      }
      
      // DNS lookup failures, refused connections, etc. should be retried
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return true;
      }
    }
    
    // By default, don't retry
    return false;
  }
  
  /**
   * Calculate the retry delay with exponential backoff
   * @param retryCount - The current retry count (0-based)
   * @returns The delay in milliseconds
   */
  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = 300; // 300ms
    const maxDelay = 10000; // 10 seconds max
    
    // Calculate delay with exponential backoff: 2^retryCount * baseDelay
    let delay = Math.min(Math.pow(2, retryCount) * baseDelay, maxDelay);
    
    // Add jitter (random amount between 0-30% of the delay)
    const jitter = delay * 0.3 * Math.random();
    delay += jitter;
    
    return delay;
  }
  
  /**
   * Create a delay promise
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ======= ISSUES =======

  /**
   * Private helper method to add activities to issues
   * @param issues - Single issue or array of issues
   * @returns Issues with activities
   */
  private async addActivitiesToIssues<T extends YouTrackTypes.Issue>(
    issues: T | T[]
  ): Promise<YouTrackTypes.IssueWithActivities[]> {
    // Handle single issue or array
    const issueArray = Array.isArray(issues) ? issues : [issues];
    
    // Fetch activities for each issue
    const issuesWithActivities = await Promise.all(
      issueArray.map(async (issue) => {
        const activities = await this.getIssueActivities(issue.id);
        return {
          ...issue,
          activities,
        } as YouTrackTypes.IssueWithActivities;
      })
    );
    
    return issuesWithActivities;
  }

  /**
   * Get an issue by ID with its activities
   * @param issueId - The ID of the issue
   * @returns The issue data with activities
   */
  async getIssue(issueId: string): Promise<YouTrackTypes.IssueWithActivities> {
    const issue = await this.request<YouTrackTypes.Issue>(`/issues/${issueId}`, {
      params: {
        fields: this.issueFields,
      },
    });
    
    // Add activities to the issue
    const issuesWithActivities = await this.addActivitiesToIssues(issue);
    return issuesWithActivities[0];
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
  ): Promise<YouTrackTypes.IssueWithActivities> {
    const issue = await this.request<YouTrackTypes.Issue>(`/issues/${issueId}`, {
      method: 'POST',
      body: data,
    });
    
    // Add activities to the issue
    const issuesWithActivities = await this.addActivitiesToIssues(issue);
    return issuesWithActivities[0];
  }

  /**
   * Search for issues using YouTrack query syntax
   * @param query - The search query
   * @param options - Search options
   * @returns The search results
   */
  async searchIssues(
    query: string,
    options: { limit?: number; skip?: number; sortBy?: string } = {}
  ): Promise<YouTrackTypes.IssueWithActivities[]> {
    const { limit = 100, skip = 0, sortBy } = options;

    const params: Record<string, string> = {
      query,
      $top: limit.toString(),
      $skip: skip.toString(),
      fields: this.issueFields,
    };

    // Only add $orderBy if sortBy is defined
    if (sortBy) {
      params.$orderBy = sortBy;
    }

    const issues = await this.request<YouTrackTypes.Issue[]>('/issues', { params });
    
    // Add activities to each issue
    return this.addActivitiesToIssues(issues);
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
    skip?: number;
  }): Promise<YouTrackTypes.IssueWithActivities[]> {
    const { project, assignee, sprint, status, type, limit = 50, skip = 0 } = criteria;

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

    return this.searchIssues(query.trim(), { limit, skip });
  }

  /**
   * Get issue attachments
   * @param issueId - The ID of the issue
   * @param options - Pagination options
   * @returns The issue attachments
   */
  async getIssueAttachments(
    issueId: string, 
    options: { limit?: number; skip?: number } = {}
  ): Promise<YouTrackTypes.IssueAttachment[]> {
    const { limit = 100, skip = 0 } = options;
    
    return this.request<YouTrackTypes.IssueAttachment[]>(`/issues/${issueId}/attachments`, {
      params: {
        fields: 'id,name,url,created,author(id,name),size,mimeType,thumbnailURL',
        $top: limit.toString(),
        $skip: skip.toString(),
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
   * @param options - Pagination options
   * @returns The issue comments
   */
  async getIssueComments(
    issueId: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<YouTrackTypes.IssueComment[]> {
    const { limit = 100, skip = 0 } = options;
    
    return this.request<YouTrackTypes.IssueComment[]>(`/issues/${issueId}/comments`, {
      params: { 
        fields: 'id,text,created,updated,author(id,name)',
        $top: limit.toString(),
        $skip: skip.toString(),
      },
    });
  }

  /**
   * Get issue links
   * @param issueId - The ID of the issue
   * @param options - Pagination options
   * @returns The issue links
   */
  async getIssueLinks(
    issueId: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<YouTrackTypes.IssueLink[]> {
    const { limit = 100, skip = 0 } = options;
    
    return this.request<YouTrackTypes.IssueLink[]>(`/issues/${issueId}/links`, {
      params: {
        fields:
          'id,direction,linkType(id,name,sourceToTarget,targetToSource),issues(id,idReadable,summary,resolved),trimmedIssues(id,idReadable,summary,resolved),issuesSize,unresolvedIssuesSize',
        $top: limit.toString(),
        $skip: skip.toString(),
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
  ): Promise<YouTrackTypes.IssueWithActivities> {
    const issue = await this.request<YouTrackTypes.Issue>('/issues', {
      method: 'POST',
      body: { ...data, project: { id: projectId } },
    });
    
    // Add activities to the issue
    const issuesWithActivities = await this.addActivitiesToIssues(issue);
    return issuesWithActivities[0];
  }

  // ======= ARTICLES =======

  /**
   * List all available articles
   * @param options - Pagination options and project filter
   * @returns Array of articles
   */
  async listArticles(
    options: { 
      limit?: number; 
      skip?: number; 
      project?: string;
    } = {}
  ): Promise<YouTrackTypes.Article[]> {
    const { limit = 100, skip = 0, project } = options;
    
    const params: Record<string, string> = {
      fields: this.articleFields,
      $top: limit.toString(),
      $skip: skip.toString(),
    };

    // Add project filter if specified
    if (project) {
      params.project = project;
    }
    
    return this.request<YouTrackTypes.Article[]>('/articles', { params });
  }

  /**
   * Get details of a specific article
   * @param articleId - The ID of the article
   * @returns The article data
   */
  async getArticle(articleId: string): Promise<YouTrackTypes.Article> {
    return this.request<YouTrackTypes.Article>(`/articles/${articleId}`, {
      params: {
        fields: this.articleFields,
      },
    });
  }

  /**
   * Get article attachments
   * @param articleId - The ID of the article
   * @param options - Pagination options
   * @returns The article attachments
   */
  async getArticleAttachments(
    articleId: string, 
    options: { limit?: number; skip?: number } = {}
  ): Promise<YouTrackTypes.ArticleAttachment[]> {
    const { limit = 100, skip = 0 } = options;
    
    return this.request<YouTrackTypes.ArticleAttachment[]>(`/articles/${articleId}/attachments`, {
      params: {
        fields: 'id,name,url,created,author(id,name),size,mimeType,thumbnailURL',
        $top: limit.toString(),
        $skip: skip.toString(),
      },
    });
  }

  /**
   * Get article comments
   * @param articleId - The ID of the article
   * @param options - Pagination options
   * @returns The article comments
   */
  async getArticleComments(
    articleId: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<YouTrackTypes.ArticleComment[]> {
    const { limit = 100, skip = 0 } = options;
    
    return this.request<YouTrackTypes.ArticleComment[]>(`/articles/${articleId}/comments`, {
      params: { 
        fields: 'id,text,created,updated,author(id,name)',
        $top: limit.toString(),
        $skip: skip.toString(),
      },
    });
  }

  /**
   * Get sub-articles of the current article
   * @param articleId - The ID of the parent article
   * @param options - Pagination options
   * @returns Array of sub-articles
   */
  async getChildArticles(
    articleId: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<YouTrackTypes.Article[]> {
    const { limit = 100, skip = 0 } = options;
    
    return this.request<YouTrackTypes.Article[]>(`/articles/${articleId}/childArticles`, {
      params: {
        fields: 'id,idReadable,summary,created,updated,reporter(id,name)',
        $top: limit.toString(),
        $skip: skip.toString(),
      },
    });
  }

  /**
   * Get the parent article of the current article
   * @param articleId - The ID of the article
   * @returns The parent article data
   */
  async getParentArticle(articleId: string): Promise<YouTrackTypes.Article | null> {
    try {
      return this.request<YouTrackTypes.Article>(`/articles/${articleId}/parentArticle`, {
        params: {
          fields: 'id,idReadable,summary,created,updated,reporter(id,name)',
        },
      });
    } catch (error) {
      // Return null if no parent article exists
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  // ======= PROJECTS =======

  /**
   * List all available projects
   * @param options - Pagination options
   * @returns Array of projects
   */
  async listProjects(
    options: { limit?: number; skip?: number } = {}
  ): Promise<YouTrackTypes.Project[]> {
    const { limit = 100, skip = 0 } = options;
    
    return this.request<YouTrackTypes.Project[]>('/admin/projects', {
      params: { 
        fields: 'id,name,shortName,description',
        $top: limit.toString(),
        $skip: skip.toString(),
      },
    });
  }

  /**
   * Find projects by name
   * @param name - Project name to search for
   * @param options - Pagination options
   * @returns Array of matching projects
   */
  async findProjectsByName(
    name: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<YouTrackTypes.Project[]> {
    const { limit = 100, skip = 0 } = options;
    
    return this.request<YouTrackTypes.Project[]>('/admin/projects', {
      params: {
        fields: 'id,name,shortName,description',
        $top: limit.toString(),
        $skip: skip.toString(),
        name: name
      },
    });
  }

  // ======= AGILE BOARDS =======

  /**
   * List all available agile boards
   * @param options - Pagination options
   * @returns Array of agile boards
   */
  async listBoards(
    options: { limit?: number; skip?: number } = {}
  ): Promise<YouTrackTypes.Board[]> {
    const { limit = 100, skip = 0 } = options;
    
    return this.request<YouTrackTypes.Board[]>('/agiles', {
      params: {
        fields: this.agileFields,
        $top: limit.toString(),
        $skip: skip.toString(),
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
    skip?: number;
  }): Promise<YouTrackTypes.Sprint[]> {
    const { boardId, sprintName, status = 'all', limit = 50, skip = 0 } = options;

    if (!boardId) {
      throw new Error('boardId is required to find sprints');
    }

    const sprints = await this.request<YouTrackTypes.Sprint[]>(`/agiles/${boardId}/sprints`, {
      params: {
        fields: 'id,name,start,finish,isCompleted',
        $top: limit.toString(),
        $skip: skip.toString(),
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
   * @param options - Pagination options
   * @returns Array of VCS changes
   */
  async getVcsChanges(
    issueId: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<YouTrackTypes.VcsChange[]> {
    const { limit = 100, skip = 0 } = options;
    
    return this.request<YouTrackTypes.VcsChange[]>(`/issues/${issueId}/changes`, {
      params: { 
        fields: 'id,date,text,author(id,name),version',
        $top: limit.toString(),
        $skip: skip.toString(),
      },
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
   * @param options - Pagination options
   * @returns Array of VCS servers
   */
  async listVcsServers(
    options: { limit?: number; skip?: number } = {}
  ): Promise<YouTrackTypes.VcsServer[]> {
    const { limit = 100, skip = 0 } = options;
    
    return this.request<YouTrackTypes.VcsServer[]>('/admin/vcsServers', {
      params: { 
        fields: 'id,url,$type',
        $top: limit.toString(),
        $skip: skip.toString(),
      },
    });
  }

  /**
   * Get VCS hosting processors
   * @param projectId - The ID of the project
   * @param options - Pagination options
   * @returns Array of VCS hosting processors
   */
  async getVcsProcessors(
    projectId: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<YouTrackTypes.VcsHostingChangesProcessor[]> {
    const { limit = 100, skip = 0 } = options;
    
    return this.request<YouTrackTypes.VcsHostingChangesProcessor[]>(
      `/admin/projects/${projectId}/vcsRepositories`,
      {
        params: {
          fields: 'id,server(id,url),path,branchSpecification,enabled',
          $top: limit.toString(),
          $skip: skip.toString(),
        },
      }
    );
  }

  /**
   * Get issue activities
   * @param issueId - The ID of the issue
   * @param options - Filter options for activities
   * @returns Array of activity items
   */
  async getIssueActivities(
    issueId: string,
    options: {
      categories?: string;
      start?: number;
      end?: number;
      author?: string;
      reverse?: boolean;
      skip?: number;
      top?: number;
    } = {}
  ): Promise<YouTrackTypes.ActivityItem[] | YouTrackTypes.CommentActivityItem[] | YouTrackTypes.IssueCreatedActivityItem[] | YouTrackTypes.CustomFieldActivityItem[] | YouTrackTypes.WorkItemActivityItem[] | YouTrackTypes.SimpleValueActivityItem[] | YouTrackTypes.VisibilityGroupActivityItem[]> {
    const { categories, start, end, author, reverse, skip, top } = options;
    
    const params: Record<string, string> = {
      categories: YouTrack.DEFAULT_ACTIVITY_CATEGORIES,
      fields: YouTrack.DEFAULT_ACTIVITY_FIELDS,
    };
    
    if (categories) params.categories = categories;
    if (start) params.start = start.toString();
    if (end) params.end = end.toString();
    if (author) params.author = author;
    if (reverse !== undefined) params.reverse = reverse.toString();
    if (skip) params.$skip = skip.toString();
    if (top) params.$top = top.toString();
    
    return this.request<YouTrackTypes.ActivityItem[]>(`/issues/${issueId}/activities`, { params });
  }

  /**
   * Get issue activities page (with pagination cursors)
   * @param issueId - The ID of the issue
   * @param options - Filter options for activities
   * @returns Activity cursor page
   */
  async getIssueActivitiesPage(
    issueId: string,
    options: {
      categories?: string;
      start?: number;
      end?: number;
      author?: string;
      reverse?: boolean;
      cursor?: string;
    } = {}
  ): Promise<YouTrackTypes.ActivityCursorPage> {
    const { categories, start, end, author, reverse, cursor } = options;
    
    const params: Record<string, string> = {
      fields: `id,beforeCursor,afterCursor,activities(${YouTrack.DEFAULT_ACTIVITY_FIELDS})`,
    };
    
    if (categories) params.categories = categories;
    if (start) params.start = start.toString();
    if (end) params.end = end.toString();
    if (author) params.author = author;
    if (reverse !== undefined) params.reverse = reverse.toString();
    if (cursor) params.cursor = cursor;
    
    return this.request<YouTrackTypes.ActivityCursorPage>(`/issues/${issueId}/activitiesPage`, { params });
  }

  // ======= BUNDLES =======

  /**
   * List bundles of a specific type
   * @param bundleType - The type of bundle to list
   * @param options - Pagination options
   * @returns Array of bundles
   */
  async listBundles(
    bundleType: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<YouTrackTypes.Bundle[]> {
    const { limit = 100, skip = 0 } = options;
    
    return this.request<YouTrackTypes.Bundle[]>(
      `/admin/customFieldSettings/bundles/${bundleType}`,
      {
        params: { 
          fields: 'id,name',
          $top: limit.toString(),
          $skip: skip.toString(),
        },
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
      `/admin/customFieldSettings/bundles/${bundleId}`,
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
   * @param options - Pagination options
   * @returns Array of bundle elements
   */
  async getBundleElements(
    bundleId: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<YouTrackTypes.BundleElement[]> {
    const { limit = 100, skip = 0 } = options;
    
    const bundle = await this.getBundle(bundleId);
    if (!bundle.values) return [];
    
    // Since we already have all values, implement pagination in memory
    return bundle.values.slice(skip, skip + limit);
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
