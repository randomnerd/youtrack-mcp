import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { BoardController } from '../../src/controllers/boardController';
import { IssueController } from '../../src/controllers/issueController';
import { SprintController } from '../../src/controllers/sprintController';
import youtrackClient from '../../src/youtrack-client';

// Define generic controller result type for testing
interface ControllerResult<T> {
  data?: T;
  error?: {
    message: string;
    statusCode: number;
  };
  success?: boolean;
}

// Custom interface for test sprint data
interface TestSprint {
  id: string;
  name: string;
  goal?: string;
  start?: string | number;
  finish?: string | number;
  status?: string; // Custom property for testing
  $type?: string;
}

// Mock the YouTrack client's methods
jest.mock('../../src/youtrack-client', () => ({
  __esModule: true,
  default: {
    listBoards: jest.fn(),
    getBoard: jest.fn(),
    getSprint: jest.fn(),
    findSprints: jest.fn(),
    searchIssues: jest.fn(),
    getIssue: jest.fn()
  }
}));

describe('YouTrack Tool Integration Tests', () => {
  const mockAxios = new MockAdapter(axios);
  const baseUrl = process.env.YOUTRACK_URL || 'https://youtrack-test.example.com/api';
  
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    mockAxios.restore();
  });
  
  describe('Board Tools Integration', () => {
    const mockBoards = [
      {
        id: 'board-1',
        name: 'Test Board 1',
        sprints: [
          { id: 'sprint-1', name: 'Sprint 1' }
        ]
      },
      {
        id: 'board-2',
        name: 'Test Board 2',
        sprints: []
      }
    ];
    
    it('should list boards from the YouTrack API', async () => {
      // Set up the mock implementation of listBoards
      (youtrackClient.listBoards as jest.Mock).mockResolvedValue(mockBoards);
      
      // Call the controller directly
      const result = await BoardController.listBoards({ limit: 10, skip: 0 });
      
      // Verify the controller returns the expected data
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(youtrackClient.listBoards).toHaveBeenCalled();
    });
    
    it('should get a specific board from the YouTrack API', async () => {
      const boardId = 'board-1';
      const mockBoard = {
        id: boardId,
        name: 'Test Board 1',
        description: 'Board for testing',
        sprints: [
          { id: 'sprint-1', name: 'Sprint 1' },
          { id: 'sprint-2', name: 'Sprint 2' }
        ]
      };
      
      // Set up the mock implementation of getBoard
      (youtrackClient.getBoard as jest.Mock).mockResolvedValue(mockBoard);
      
      // Call the controller directly
      const result = await BoardController.getBoard(boardId);
      
      // Verify the controller returns the expected data
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(youtrackClient.getBoard).toHaveBeenCalledWith(boardId);
    });
  });
  
  describe('Sprint Tools Integration', () => {
    const boardId = 'board-1';
    const sprintId = 'sprint-1';
    
    const mockSprint: TestSprint = {
      id: sprintId,
      name: 'Sprint 1',
      goal: 'Complete feature X',
      start: '2023-07-01T00:00:00Z',
      finish: '2023-07-14T23:59:59Z',
      status: 'active'
    };
    
    const mockSprints: TestSprint[] = [
      mockSprint,
      {
        id: 'sprint-2',
        name: 'Sprint 2',
        goal: 'Complete feature Y',
        start: '2023-07-15T00:00:00Z',
        finish: '2023-07-28T23:59:59Z',
        status: 'active'
      },
      {
        id: 'sprint-3',
        name: 'Sprint 3',
        goal: 'Bug fixes',
        start: '2023-06-01T00:00:00Z',
        finish: '2023-06-14T23:59:59Z',
        status: 'archived'
      }
    ];
    
    const mockSprintIssues = [
      {
        id: 'issue-1',
        summary: 'Implement feature X',
        description: 'Implementation details for feature X'
      },
      {
        id: 'issue-2',
        summary: 'Fix bug in feature X',
        description: 'Bug details for feature X'
      }
    ];
    
    it('should get a specific sprint from the YouTrack API', async () => {
      // Set up the mock implementation of getSprint
      (youtrackClient.getSprint as jest.Mock).mockResolvedValue(mockSprint);
      
      // Call the controller directly
      const result = await SprintController.getSprint(boardId, sprintId);
      
      // Verify the controller returns the expected data
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      if (result.data) {
        // Check sprint data properties
        expect(result.data.sprint).toBeDefined();
        expect(result.data.sprint.id).toBe(sprintId);
        expect(result.data.sprint.name).toBe('Sprint 1');
      }
      expect(youtrackClient.getSprint).toHaveBeenCalledWith(boardId, sprintId);
    });
    
    it('should find sprints by board ID and status', async () => {
      // Set up the mock to return sprints with status already set
      const activeSprints = mockSprints.filter(s => s.status === 'active');
      
      (youtrackClient.findSprints as jest.Mock).mockResolvedValue(
        // Return sprints without status - the model will add it
        activeSprints.map(({status, ...sprint}) => ({
          ...sprint,
          // Add archived and isCompleted properties to simulate real API response
          archived: false,
          isCompleted: false
        }))
      );
      
      // Call the controller directly
      const result = await SprintController.findSprints({
        boardId,
        status: 'active',
        limit: 10,
        skip: 0
      });
      
      // Verify the controller returns the expected data
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      if (result.data) {
        // Check sprints data properties
        expect(result.data.sprints).toBeDefined();
        expect(Array.isArray(result.data.sprints)).toBe(true);
        expect(result.data.sprints.length).toBe(2); // 2 active sprints in our mock data
        
        // Check status by accessing as TestSprint
        const sprints = result.data.sprints as unknown as TestSprint[];
        expect(sprints[0].status).toBe('active');
        expect(sprints[1].status).toBe('active');
      }
      expect(youtrackClient.findSprints).toHaveBeenCalledWith(
        expect.objectContaining({
          boardId,
          status: 'active'
        })
      );
    });
    
    it('should find sprints by name', async () => {
      // We should only get Sprint 1 when filtering
      const sprint1 = mockSprints.find(s => s.name === 'Sprint 1');
      
      // Set up the mock to return both sprints (before filtering)
      (youtrackClient.findSprints as jest.Mock).mockResolvedValue(
        mockSprints.map(({status, ...sprint}) => ({
          ...sprint,
          // Add archived and isCompleted properties to simulate real API response
          archived: false,
          isCompleted: false
        }))
      );
      
      // Call the controller directly
      const result = await SprintController.findSprints({
        boardId,
        sprintName: 'Sprint 1'
      });
      
      // Verify the controller returns the expected data
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      if (result.data) {
        // Check sprints data properties
        expect(result.data.sprints).toBeDefined();
        expect(Array.isArray(result.data.sprints)).toBe(true);
        expect(result.data.sprints.length).toBe(1);
        expect(result.data.sprints[0].name).toBe('Sprint 1');
      }
      expect(youtrackClient.findSprints).toHaveBeenCalledWith(
        expect.objectContaining({
          boardId,
          sprintName: 'Sprint 1'
        })
      );
    });
    
    it('should handle errors from the YouTrack API when getting a sprint', async () => {
      const nonExistentSprintId = 'non-existent-sprint';
      
      // Set up the mock implementation of getSprint to throw an error
      (youtrackClient.getSprint as jest.Mock).mockRejectedValue(
        new Error('Sprint not found')
      );
      
      // Call the controller directly
      const result = await SprintController.getSprint(boardId, nonExistentSprintId);
      
      // Verify the controller returns the error
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(youtrackClient.getSprint).toHaveBeenCalledWith(boardId, nonExistentSprintId);
    });
  });
  
  describe('Issue Tools Integration', () => {
    const query = 'project: TEST #Unresolved';
    const mockIssues = [
      {
        id: 'issue-1',
        summary: 'Test Issue 1',
        description: 'Description for test issue 1',
        fields: [
          { 
            $type: 'StateIssueCustomField',
            name: 'State',
            value: { name: 'Open' } 
          }
        ]
      },
      {
        id: 'issue-2',
        summary: 'Test Issue 2',
        description: 'Description for test issue 2',
        fields: [
          { 
            $type: 'StateIssueCustomField',
            name: 'State',
            value: { name: 'In Progress' } 
          }
        ]
      }
    ];
    
    it('should search issues using the YouTrack API', async () => {
      // Set up the mock implementation of searchIssues
      (youtrackClient.searchIssues as jest.Mock).mockResolvedValue(mockIssues);
      
      // Call the controller directly
      const result = await IssueController.searchIssues(query, { limit: 10, skip: 0 });
      
      // Verify the controller returns the expected data
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(youtrackClient.searchIssues).toHaveBeenCalledWith(
        query, 
        expect.objectContaining({ limit: 10, skip: 0 })
      );
    });
    
    it('should handle errors from the YouTrack API', async () => {
      const issueId = 'non-existent-issue';
      
      // Set up the mock implementation of getIssue to throw an error
      (youtrackClient.getIssue as jest.Mock).mockRejectedValue(
        new Error('Issue not found')
      );
      
      // Call the controller directly
      const result = await IssueController.getIssue(issueId);
      
      // Verify the controller returns an error response
      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
      expect(youtrackClient.getIssue).toHaveBeenCalledWith(issueId);
    });
  });
}); 