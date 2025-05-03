import * as YouTrackTypes from '../types/youtrack';
import { CommonView, McpResponse, ResourceResponse } from './common';
import { formatBoardListItem, formatBoardProjects, formatSprintDetailItem } from '../utils/view-utils';

export class BoardView {
  static renderList(boards: YouTrackTypes.Board[]): McpResponse {
    const boardsText = boards
      .map(board => formatBoardListItem(board))
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Summary: Found ${boards.length} agile boards`,
        },
        {
          type: 'text',
          text: `Boards Overview:\n\n${boardsText}`,
        }
      ],
    };
  }

  static renderDetail(board: YouTrackTypes.Board): McpResponse {
    const sprintsText =
      board.sprints && board.sprints.length > 0
        ? board.sprints
            .map(sprint => formatSprintDetailItem(sprint))
            .join('\n')
        : '  No sprints found';

    const projectsText = formatBoardProjects(board);

    return {
      content: [
        {
          type: 'text',
          text: `Summary: Board "${board.name}" (ID: ${board.id})`,
        },
        {
          type: 'text',
          text: `Board Details:\nName: ${board.name} (ID: ${board.id})\nProjects: ${projectsText}\n\nSprints:\n${sprintsText}`,
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

    if (Array.isArray(board)) {
      // List of boards
      const boardsText = board.map(b => formatBoardListItem(b)).join('\n\n');
      
      return CommonView.createResourceResponse(uri, `Found ${board.length} agile boards:\n\n${boardsText}`);
    } else {
      // Single board
      const sprintsText = board.sprints && board.sprints.length > 0
        ? board.sprints.map(sprint => formatSprintDetailItem(sprint)).join('\n')
        : '  No sprints found';
      
      return CommonView.createResourceResponse(uri, `Board: ${board.name} (ID: ${board.id})\n\nProjects: ${formatBoardProjects(board)}\n\nSprints:\n${sprintsText}`);
    }
  }
} 