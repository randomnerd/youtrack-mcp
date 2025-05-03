import { Board } from '../../src/types/youtrack';

// Sample board data that matches YouTrack API structure
export const boards: Board[] = [
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

export const listBoards = boards;

export default {
  boards,
  listBoards
}; 