import { Sprint } from '../../src/types/youtrack';

export const sprints: Sprint[] = [
  {
    id: '101',
    name: 'Sprint 1',
    start: Date.now() - 1209600000, // 14 days ago
    finish: Date.now() + 1209600000, // 14 days from now
    isCompleted: false,
    archived: false,
    isDefault: false,
    issues: []
  },
  {
    id: '102',
    name: 'Sprint 2',
    start: Date.now() + 1209600000, // 14 days from now
    finish: Date.now() + 2419200000, // 28 days from now
    isCompleted: false,
    archived: false,
    isDefault: true,
    issues: []
  },
  {
    id: '103',
    name: 'Completed Sprint',
    start: Date.now() - 2419200000, // 28 days ago
    finish: Date.now() - 1209600000, // 14 days ago
    isCompleted: true,
    archived: true,
    isDefault: false,
    issues: []
  }
];

export const sprintsByBoard: Record<string, Sprint[]> = {
  '1': [sprints[0], sprints[2]],
  '2': [sprints[1]]
};

export default {
  sprints,
  sprintsByBoard
}; 