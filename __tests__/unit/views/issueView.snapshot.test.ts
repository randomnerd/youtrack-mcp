import { IssueView } from '../../../src/views/issueView';
import fs from 'fs';
import path from 'path';
import { Issue } from '../../../src/types/youtrack';
import { formatYouTrackData } from '../../../src/utils/youtrack-json-formatter';
import { formatIssueForAI } from '../../../src/utils/issue-formatter';
import { createControllerResult } from '../../helpers/testUtils';
import { IssueListResult, type ControllerResult, type IssueDetailResult } from '../../../src/types/controllerResults';

// Load issue fixture from JSON file
const issueFixturePath = path.join(__dirname, '../../fixtures/issue.json');
const issueFixture = JSON.parse(fs.readFileSync(issueFixturePath, 'utf8'));

// Mock the formatters
jest.mock('../../../src/utils/youtrack-json-formatter', () => ({
  formatYouTrackData: jest.fn().mockImplementation((data) => JSON.stringify(data))
}));

jest.mock('../../../src/utils/issue-formatter', () => ({
  formatIssueForAI: jest.fn().mockImplementation((issue) => `Formatted issue ${issue.id}`),
  formatIssuesForAI: jest.fn().mockImplementation((issues) => `Formatted ${issues.length} issues`)
}));

describe('IssueView Snapshots', () => {
  // Define sample issues
  const sampleIssue: Issue = {
    id: 'sample-1',
    idReadable: 'TEST-123',
    numberInProject: 123,
    summary: 'Sample issue for testing',
    description: 'This is a sample issue for testing',
    customFields: [],
    $type: 'Issue'
  };

  const minimalIssue: Issue = {
    id: 'minimal-1',
    idReadable: 'MIN-1',
    numberInProject: 1,
    summary: 'Minimal issue',
    $type: 'Issue'
  };

  const issuesList: Issue[] = [
    sampleIssue,
    minimalIssue,
    {
      id: 'sample-2',
      idReadable: 'TEST-124',
      numberInProject: 124,
      summary: 'Another sample issue',
      $type: 'Issue'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format a complete issue consistently', () => {
    // Create result with sample issue
    const result = createControllerResult({ issue: sampleIssue });
    
    // Render the issue with JSON formatting
    const response = IssueView.renderDetail(result);
    
    // Assert that the response matches the snapshot
    expect(response).toMatchSnapshot();
    expect(formatYouTrackData).toHaveBeenCalledWith(sampleIssue, { stringify: true });
  });
  
  it('should format a minimal issue consistently', () => {
    // Create result with minimal issue
    const result = createControllerResult({ issue: minimalIssue });
    
    // Render the issue with text formatting
    const response = IssueView.renderDetail(result, false);
    
    // Assert that the response matches the snapshot
    expect(response).toMatchSnapshot();
    expect(formatIssueForAI).toHaveBeenCalledWith(minimalIssue);
  });
  
  it('should format a list of issues consistently', () => {
    // Create result with issues list and required total property
    const issueListResult: IssueListResult = {
      issues: issuesList,
      title: 'Test Issues',
      total: issuesList.length
    };
    
    const result = createControllerResult(issueListResult);
    
    // Render the issues list with JSON formatting
    const response = IssueView.renderList(result);
    
    // Assert that the response matches the snapshot
    expect(response).toMatchSnapshot();
    expect(formatYouTrackData).toHaveBeenCalledWith(issuesList, { stringify: true });
  });
  
  it('should format different issue custom fields consistently', () => {
    // Load the complex issue from the fixture which has various custom fields
    const complexIssue: Issue = issueFixture as Issue;
    
    // Create result with the complex issue
    const result = createControllerResult({ issue: complexIssue });
    
    // Render the issue with JSON formatting
    const response = IssueView.renderDetail(result);
    
    // Assert that the response matches the snapshot
    expect(response).toMatchSnapshot('complex-issue-with-custom-fields');
    expect(formatYouTrackData).toHaveBeenCalledWith(complexIssue, { stringify: true });
  });
  
  it('should handle error responses consistently', () => {
    // Create an error result
    const errorResult = createControllerResult(undefined, false, 'Issue not found');
    
    // Render the error
    const response = IssueView.renderDetail(errorResult as unknown as ControllerResult<IssueDetailResult>);
    
    // Assert that the error response matches the snapshot
    expect(response).toMatchSnapshot('error-response');
  });
}); 