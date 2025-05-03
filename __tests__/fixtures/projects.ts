import { Project } from '../../src/types/youtrack';

// Sample projects for testing
const projects: Project[] = [
  {
    id: '1',
    name: 'Main Project',
    shortName: 'MAIN',
    description: 'This is the main project for testing',
    $type: 'Project'
  },
  {
    id: '2',
    name: 'Secondary Project',
    shortName: 'SEC',
    description: 'Secondary project for feature development',
    $type: 'Project'
  },
  {
    id: '3',
    name: 'Bug Tracker',
    shortName: 'BUG',
    description: 'Project dedicated to bug tracking',
    $type: 'Project'
  }
];

// Export the projects for use in tests
export default {
  projects,
  // Simulated API response format
  listProjects: projects
}; 