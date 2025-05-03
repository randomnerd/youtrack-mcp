import { Board } from '../../src/types/youtrack';
import fs from 'fs';
import path from 'path';

// Path to the real data
const realBoardsPath = path.join(__dirname, '..', '..', 'output', 'tests', 'real-all-boards.json');
const realSelectedBoardPath = path.join(__dirname, '..', '..', 'output', 'tests', 'real-selected-board.json');

// Load real data if available, otherwise use sample data
let boards: Board[] = [];
let selectedBoard: Board | null = null;

try {
  const boardsData = fs.readFileSync(realBoardsPath, 'utf8');
  boards = JSON.parse(boardsData);
  
  try {
    const selectedBoardData = fs.readFileSync(realSelectedBoardPath, 'utf8');
    selectedBoard = JSON.parse(selectedBoardData);
  } catch (error) {
    console.warn('Could not load selected board data, using first board instead');
    selectedBoard = boards[0];
  }
} catch (error) {
  console.warn('Could not load real board data, using sample data instead');
  // Sample board data that matches YouTrack API structure
  boards = [
    {
      id: '100-83',
      name: 'Sample Sprint Board',
      $type: 'Agile'
    },
    {
      id: '1',
      name: 'Test Board 1',
      $type: 'Agile'
    },
    {
      id: '2',
      name: 'Test Board 2',
      $type: 'Agile'
    }
  ];
  selectedBoard = boards[0];
}

export const listBoards = boards;
export const board = selectedBoard;

export default {
  boards,
  listBoards,
  board
}; 