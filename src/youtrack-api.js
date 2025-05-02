import fetch from 'node-fetch';
    import { youtrackConfig } from './config.js';

    // Helper function for API requests
    async function apiRequest(endpoint, options = {}) {
      if (!youtrackConfig.baseUrl || !youtrackConfig.token) {
        throw new Error('YouTrack configuration is incomplete. Please set YOUTRACK_URL and YOUTRACK_TOKEN.');
      }

      const url = `${youtrackConfig.baseUrl}/api/${endpoint}`;
      const headers = {
        'Authorization': `Bearer ${youtrackConfig.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      };

      try {
        const response = await fetch(url, {
          ...options,
          headers
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`YouTrack API error (${response.status}): ${errorText}`);
        }

        // Return null for 204 No Content responses
        if (response.status === 204) {
          return null;
        }

        return await response.json();
      } catch (error) {
        console.error('YouTrack API request failed:', error.message);
        throw error;
      }
    }

    // Get all agile boards
    export async function getAgileBoards() {
      return apiRequest('agiles?fields=id,name,projects(id,name),sprints(id,name,start,finish)');
    }

    // Get a specific agile board
    export async function getAgileBoard(boardId) {
      return apiRequest(`agiles/${boardId}?fields=id,name,projects(id,name),sprints(id,name,start,finish,status),columns(presentation),swimlanes(presentation)`);
    }

    // Get sprint details
    export async function getSprint(boardId, sprintId) {
      return apiRequest(`agiles/${boardId}/sprints/${sprintId}?fields=id,name,start,finish,status,board(id,name),issues(id,summary,description,customFields(id,name,value(name)),resolved)`);
    }

    // Get issues in a sprint
    export async function getSprintIssues(boardId, sprintId) {
      return apiRequest(`agiles/${boardId}/sprints/${sprintId}/issues?fields=id,summary,description,customFields(id,name,value(name)),resolved`);
    }

    // Get issue details
    export async function getIssue(issueId) {
      return apiRequest(`issues/${issueId}?fields=id,summary,description,customFields(id,name,value(name)),comments(text,author(name)),resolved`);
    }

    // Create a new issue
    export async function createIssue(projectId, summary, description = '', customFields = []) {
      return apiRequest('issues', {
        method: 'POST',
        body: JSON.stringify({
          project: { id: projectId },
          summary,
          description,
          customFields
        })
      });
    }

    // Update an issue
    export async function updateIssue(issueId, updates) {
      return apiRequest(`issues/${issueId}`, {
        method: 'POST',
        body: JSON.stringify(updates)
      });
    }

    // Add a comment to an issue
    export async function addComment(issueId, text) {
      return apiRequest(`issues/${issueId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text })
      });
    }

    // Get projects
    export async function getProjects() {
      return apiRequest('admin/projects?fields=id,name,shortName');
    }
