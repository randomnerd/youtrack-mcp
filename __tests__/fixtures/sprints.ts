import { Sprint } from '../../src/types/youtrack';
import fs from 'fs';
import path from 'path';
import boardFixtures from './boards';

// Path to the real data
const realSprintsPath = path.join(__dirname, '..', '..', 'output', 'tests', 'real-all-sprints.json');
const realCurrentSprintPath = path.join(__dirname, '..', '..', 'output', 'tests', 'real-current-sprint.json');

// Load real data if available, otherwise use sample data
let sprints: Sprint[] = [];
let currentSprint: Sprint | null = null;
let sprintsByBoard: Record<string, Sprint[]> = {};

try {
  const sprintsData = fs.readFileSync(realSprintsPath, 'utf8');
  sprints = JSON.parse(sprintsData);
  
  try {
    const currentSprintData = fs.readFileSync(realCurrentSprintPath, 'utf8');
    currentSprint = JSON.parse(currentSprintData);
  } catch (error) {
    console.warn('Could not load current sprint data, using first sprint instead');
    currentSprint = sprints[0];
  }
  
  // Create a mapping of sprints by board
  if (boardFixtures.boards && boardFixtures.boards.length > 0) {
    const firstBoardId = boardFixtures.boards[0].id;
    sprintsByBoard[firstBoardId] = sprints;
  }
} catch (error) {
  console.warn('Could not load real sprint data, using sample data instead');
  // Sample sprint data that matches YouTrack API structure
  sprints = [
    {
      id: '100-441',
      name: 'Sample Sprint 7',
      start: 1714359600000, // 4/28/2025, 3:00:00 AM
      finish: 1716173999000, // 5/19/2025, 2:59:59 AM
      isCompleted: false,
      archived: false,
      isDefault: false,
      issues: [], // These would be populated in tests as needed
      $type: 'Sprint'
    },
    {
      id: '101',
      name: 'Sprint 1',
      start: Date.now() - 1209600000, // 14 days ago
      finish: Date.now() + 1209600000, // 14 days from now
      isCompleted: false,
      archived: false,
      isDefault: false,
      issues: [],
      $type: 'Sprint'
    },
    {
      id: '102',
      name: 'Sprint 2',
      start: Date.now() + 1209600000, // 14 days from now
      finish: Date.now() + 2419200000, // 28 days from now
      isCompleted: false,
      archived: false,
      isDefault: true,
      issues: [],
      $type: 'Sprint'
    },
    {
      id: '103',
      name: 'Completed Sprint',
      start: Date.now() - 2419200000, // 28 days ago
      finish: Date.now() - 1209600000, // 14 days ago
      isCompleted: true,
      archived: true,
      isDefault: false,
      issues: [],
      $type: 'Sprint'
    }
  ];
  
  currentSprint = sprints[0];
  
  sprintsByBoard = {
    '100-83': [sprints[0]], // Sample board with sample sprint
    '1': [sprints[1], sprints[3]],
    '2': [sprints[2]]
  };
}

export const sprint = currentSprint;

export default {
  sprints,
  sprintsByBoard,
  sprint
}; 