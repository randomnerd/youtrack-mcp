import {
  DEFAULT_ACTIVITY_FIELDS,
  DEFAULT_ISSUE_FIELDS,
  DEFAULT_SPRINT_FIELDS,
  DEFAULT_AGILE_FIELDS
} from '../../../src/utils/field-definitions';

describe('Field definitions', () => {
  describe('DEFAULT_ACTIVITY_FIELDS', () => {
    it('should be a non-empty string', () => {
      expect(typeof DEFAULT_ACTIVITY_FIELDS).toBe('string');
      expect(DEFAULT_ACTIVITY_FIELDS).not.toBe('');
    });

    it('should contain essential activity fields', () => {
      expect(DEFAULT_ACTIVITY_FIELDS).toContain('activities($type');
      expect(DEFAULT_ACTIVITY_FIELDS).toContain('author');
      expect(DEFAULT_ACTIVITY_FIELDS).toContain('created');
    });
  });

  describe('DEFAULT_ISSUE_FIELDS', () => {
    it('should be a non-empty string', () => {
      expect(typeof DEFAULT_ISSUE_FIELDS).toBe('string');
      expect(DEFAULT_ISSUE_FIELDS).not.toBe('');
    });

    it('should contain essential issue fields', () => {
      expect(DEFAULT_ISSUE_FIELDS).toContain('id');
      expect(DEFAULT_ISSUE_FIELDS).toContain('idReadable');
      expect(DEFAULT_ISSUE_FIELDS).toContain('summary');
      expect(DEFAULT_ISSUE_FIELDS).toContain('project');
    });
  });

  describe('DEFAULT_SPRINT_FIELDS', () => {
    it('should be a non-empty string', () => {
      expect(typeof DEFAULT_SPRINT_FIELDS).toBe('string');
      expect(DEFAULT_SPRINT_FIELDS).not.toBe('');
    });

    it('should contain essential sprint fields', () => {
      expect(DEFAULT_SPRINT_FIELDS).toContain('id');
      expect(DEFAULT_SPRINT_FIELDS).toContain('name');
      expect(DEFAULT_SPRINT_FIELDS).toContain('start');
      expect(DEFAULT_SPRINT_FIELDS).toContain('finish');
    });
  });

  describe('DEFAULT_AGILE_FIELDS', () => {
    it('should be a non-empty string', () => {
      expect(typeof DEFAULT_AGILE_FIELDS).toBe('string');
      expect(DEFAULT_AGILE_FIELDS).not.toBe('');
    });

    it('should contain essential agile fields', () => {
      expect(DEFAULT_AGILE_FIELDS).toContain('id');
      expect(DEFAULT_AGILE_FIELDS).toContain('name');
      expect(DEFAULT_AGILE_FIELDS).toContain('owner');
      expect(DEFAULT_AGILE_FIELDS).toContain('projects');
      expect(DEFAULT_AGILE_FIELDS).toContain('sprints');
    });

    it('should include sprint fields', () => {
      expect(DEFAULT_AGILE_FIELDS).toContain(DEFAULT_SPRINT_FIELDS);
    });
  });
}); 