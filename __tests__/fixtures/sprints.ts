import { Sprint } from '../../src/types/youtrack';

// Sample sprint data that matches YouTrack API structure
export const sprints: Sprint[] = [
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

export const sprintsByBoard: Record<string, Sprint[]> = {
  '100-83': [sprints[0]], // Sample board with sample sprint
  '1': [sprints[1], sprints[3]],
  '2': [sprints[2]]
};

export default {
  sprints,
  sprintsByBoard
}; 