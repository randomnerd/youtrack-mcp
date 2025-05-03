import youtrackClient from '../youtrack-client';
import * as YouTrackTypes from '../types/youtrack';

export class BoardModel {
  static async getAll(options?: { limit?: number; skip?: number }): Promise<YouTrackTypes.Board[]> {
    return youtrackClient.listBoards(options);
  }

  static async getById(boardId: string): Promise<YouTrackTypes.Board | null> {
    return youtrackClient.getBoard(boardId);
  }
} 