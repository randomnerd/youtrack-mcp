import { FieldBuilder } from '../../../src/utils/field-builder';

describe('FieldBuilder', () => {
  let builder: FieldBuilder;

  beforeEach(() => {
    builder = new FieldBuilder();
  });

  it('should initialize with empty fields when no initial fields are provided', () => {
    expect(builder.build()).toBe('');
  });

  it('should initialize with the provided initial fields', () => {
    builder = new FieldBuilder('id,name,description');
    expect(builder.build()).toBe('id,name,description');
  });

  it('should add a single field', () => {
    builder.add('id');
    expect(builder.build()).toBe('id');
  });

  it('should add multiple fields', () => {
    builder.add('id');
    builder.add('name');
    builder.add('description');
    
    const result = builder.build();
    
    expect(result).toContain('id');
    expect(result).toContain('name');
    expect(result).toContain('description');
  });

  it('should deduplicate fields', () => {
    builder.add('id');
    builder.add('id');
    // The FieldBuilder now deduplicates fields
    expect(builder.build()).toBe('id');
  });

  it('should deduplicate fields when using addFields', () => {
    builder.addFields(['id', 'name', 'id', 'description', 'name']);
    
    const result = builder.build();
    const fields = result.split(',');
    
    expect(fields.length).toBe(3); // Only unique fields
    expect(fields).toContain('id');
    expect(fields).toContain('name');
    expect(fields).toContain('description');
  });

  it('should support chaining', () => {
    const result = builder.add('id').add('name').add('description').build();
    
    expect(result).toContain('id');
    expect(result).toContain('name');
    expect(result).toContain('description');
  });

  it('should add an array of fields', () => {
    builder.addFields(['id', 'name', 'description']);
    
    const result = builder.build();
    
    expect(result).toContain('id');
    expect(result).toContain('name');
    expect(result).toContain('description');
  });

  it('should support nested fields', () => {
    builder.add('customFields(id,name,value)');
    expect(builder.build()).toBe('customFields(id,name,value)');
  });

  it('should preserve field order', () => {
    builder = new FieldBuilder();
    builder.add('id');
    builder.add('name');
    builder.add('description');
    
    const result = builder.build();
    const expectedStart = 'id,';
    
    expect(result.startsWith(expectedStart)).toBeTruthy();
  });
}); 