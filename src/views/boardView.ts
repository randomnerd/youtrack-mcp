import * as YouTrackTypes from '../types/youtrack';
import { CommonView, McpResponse, ResourceResponse } from './common';
import { formatBoardListItem, formatBoardProjects, formatSprintDetailItem } from '../utils/view-utils';
import { formatYouTrackData } from '../utils/youtrack-json-formatter';
import type { BoardDetailResult, BoardListResult, ControllerResult } from '../types/controllerResults';
export class BoardView {
  static renderList(result: ControllerResult<BoardListResult>): McpResponse {
    if (!result.success || !result.data) {
      return this.renderError(result.error || 'Failed to fetch boards');
    }
    
    const { boards } = result.data;
    
    return {
      content: [
        {
          type: 'text',
          text: formatYouTrackData(boards, { stringify: true }),
        }
      ],
    };
  }

  static renderDetail(result: ControllerResult<BoardDetailResult>): McpResponse {
    if (!result.success || !result.data) {
      return this.renderError(result.error || 'Failed to fetch board');
    }
    
    const { board } = result.data;
    
    return {
      content: [
        {
          type: 'text',
          text: formatYouTrackData(board, { stringify: true }),
        }
      ],
    };
  }

  static renderEmpty = CommonView.renderEmpty;
  static renderError = CommonView.renderError;

  static handleResourceRequest(uri: URL, board?: YouTrackTypes.Board | YouTrackTypes.Board[]): ResourceResponse {
    if (!board) {
      return CommonView.createResourceResponse(uri, "No board data available");
    }

    return CommonView.createResourceResponse(uri, formatYouTrackData(board, { stringify: true }));
  }
} 