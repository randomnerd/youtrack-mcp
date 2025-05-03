import * as YouTrackTypes from '../types/youtrack';
import { CommonView, McpResponse, ResourceResponse } from './common';
import { formatIssueForAI, formatIssuesForAI } from '../utils/issue-formatter';
import { formatSprintListItem, formatSprintPeriod, formatIssueStatus, createSeparator } from '../utils/view-utils';
import { Request, type ControllerResult, type SprintDetailResult, type SprintListResult } from '../types/controllerResults';
import { formatYouTrackData } from '../utils/youtrack-json-formatter';

export class SprintView {
  static renderDetail(result: ControllerResult<SprintDetailResult>): McpResponse {
    if (!result.success || !result.data) {
      return this.renderError(result.error || 'Failed to fetch sprint details');
    }

    return {
      content: [
        { type: "text" as const, text: formatYouTrackData(result.data, { stringify: true }) }
      ],
    };
  }

  static renderList(result: ControllerResult<SprintListResult>, boardName?: string): McpResponse {
    if (!result.success || !result.data) {
      return this.renderError(result.error || 'Failed to fetch sprints');
    }

    return {
      content: [{ 
        type: "text" as const, 
        text: formatYouTrackData(result.data, { stringify: true }) 
      }]
    };
  }

  static renderEmpty = CommonView.renderEmpty;
  static renderError = CommonView.renderError;

  static handleResourceRequest(uri: URL, params: Record<string, string | undefined>, sprint?: YouTrackTypes.Sprint | YouTrackTypes.Sprint[], board?: YouTrackTypes.Board): ResourceResponse {
    const boardId = params?.boardId || 'unknown';
    
    if (!sprint) {
      return CommonView.createResourceResponse(uri, "No sprint data available");
    }

    return CommonView.createResourceResponse(uri, formatYouTrackData(sprint, { stringify: true }));
  }
} 
