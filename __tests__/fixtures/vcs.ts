import * as YouTrackTypes from '../../src/types/youtrack';

export const vcsFixtures = {
  listVcsChanges: [
    {
      $type: 'VcsChange',
      id: 'vcs-change-1',
      version: 'abcdef1234567890',
      vcsDate: 1678886400000,
      author: {
        $type: 'User',
        id: 'user-1',
        login: 'testuser',
        fullName: 'Test User',
      },
      message: 'Initial commit',
      url: 'http://example.com/repo/commit/abcdef1234567890',
      nameInVcs: 'commit-1',
      project: {
        $type: 'Project',
        id: 'project-1',
        name: 'Test Project',
        shortName: 'TP',
      },
      files: [
        {
          $type: 'VcsFileChange',
          changeType: 'ADDED',
          fileName: 'file1.txt',
        },
        {
          $type: 'VcsFileChange',
          changeType: 'MODIFIED',
          fileName: 'file2.js',
        },
      ],
      issue: [
        {
          $type: 'Issue',
          id: 'issue-1',
          idReadable: 'TP-1',
          summary: 'Initial issue',
        },
      ],
    },
    {
      $type: 'VcsChange',
      id: 'vcs-change-2',
      version: 'abcdef1234567890',
      vcsDate: 1678886400000,
      author: {
        $type: 'User',
        id: 'user-2',
        login: 'testuser',
        fullName: 'Test User',
      },
      message: 'Initial commit',
      url: 'http://example.com/repo/commit/abcdef1234567890',
      nameInVcs: 'commit-2',
      project: {
        $type: 'Project',
        id: 'project-2',
        name: 'Test Project',
        shortName: 'TP',
      },
      files: [
        {
          $type: 'VcsFileChange',
          changeType: 'ADDED',
          fileName: 'file1.txt',
        },
        {
          $type: 'VcsFileChange',
          changeType: 'MODIFIED',
          fileName: 'file2.js',
        },
      ],
      issue: [
        {
          $type: 'Issue',
          id: 'issue-2',
          idReadable: 'TP-2',
          summary: 'Initial issue',
        },
      ],
    },
  ],
}; 