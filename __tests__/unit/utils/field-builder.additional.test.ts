import { FieldBuilder } from '../../../src/utils/field-builder';

describe('FieldBuilder - Edge Cases', () => {
  describe('parseFieldString', () => {
    it('should handle empty string', () => {
      const result = FieldBuilder.parseFieldString('');
      expect(result).toEqual([]);
    });

    it('should handle string with only whitespace', () => {
      const result = FieldBuilder.parseFieldString('  ');
      expect(result).toEqual([]);
    });

    it('should handle string with trailing comma', () => {
      const result = FieldBuilder.parseFieldString('id,name,');
      expect(result).toEqual([
        { name: 'id' },
        { name: 'name' }
      ]);
    });

    it('should handle string with empty fields', () => {
      const result = FieldBuilder.parseFieldString('id,,name');
      expect(result).toEqual([
        { name: 'id' },
        { name: 'name' }
      ]);
    });

    it('should handle unbalanced parentheses', () => {
      const result = FieldBuilder.parseFieldString('id,project(name');
      expect(result).toEqual([
        { name: 'id' },
        { name: 'project', children: [{ name: 'name' }] }
      ]);
    });

    it('should handle extra closing parentheses', () => {
      const result = FieldBuilder.parseFieldString('id,project(name))');
      expect(result[0].name).toBe('id');
      expect(result[1].name).toBe('project');
      expect(Array.isArray(result[1].children)).toBeTruthy();
    });

    it('should handle deeply nested fields', () => {
      const result = FieldBuilder.parseFieldString('field1(field2(field3(field4)))');
      expect(result[0].name).toBe('field1');
      expect(result[0].children?.[0].name).toBe('field2');
      expect(result[0].children?.[0].children?.[0].name).toBe('field3');
    });
  });

  describe('add method', () => {
    it('should ignore empty field names', () => {
      const builder = new FieldBuilder();
      builder.add('');
      expect(builder.build()).toBe('');
    });

    it('should ignore undefined field names', () => {
      const builder = new FieldBuilder();
      builder.add(undefined as unknown as string);
      expect(builder.build()).toBe('');
    });

    it('should handle adding fields with whitespace', () => {
      const builder = new FieldBuilder();
      builder.add('  field  ');
      const result = builder.build();
      expect(result).toBe('  field  ');
    });
  });

  describe('addNestedField', () => {
    it('should handle adding to existing complex structure', () => {
      const builder = new FieldBuilder('project(id,name,custom(field1))');
      builder.add('project.custom.field2');
      const result = builder.build();
      expect(result).toBe('project(id,name,custom(field2))');
    });

    it('should maintain existing fields when adding nested fields', () => {
      const builder = new FieldBuilder('id,name');
      builder.add('project.field');
      expect(builder.build()).toBe('id,name,project(field)');
    });
  });

  describe('addFields', () => {
    it('should handle empty array', () => {
      const builder = new FieldBuilder();
      builder.addFields([]);
      expect(builder.build()).toBe('');
    });

    it('should handle array with empty strings', () => {
      const builder = new FieldBuilder();
      builder.addFields(['', 'field', '']);
      expect(builder.build()).toBe('field');
    });
  });

  describe('static methods', () => {
    describe('addField', () => {
      it('should handle multi-level paths properly', () => {
        const original = 'id,project(id,name,custom(field1))';
        const result = FieldBuilder.addField(original, 'project.custom', 'field2');
        expect(result).toBe('id,project(id,name,custom(field2))');
      });

      it('should handle empty path gracefully', () => {
        const original = 'id,name';
        const result = FieldBuilder.addField(original, '', 'field');
        expect(result).toBe(original);
      });
    });

    describe('removeField', () => {
      it('should remove fields at correct nested level', () => {
        const original = 'id,project(id,name,custom(field1,field2))';
        const result = FieldBuilder.removeField(original, 'project.custom');
        expect(result).toBe('id,project(id,name)');
      });

      it('should handle field path with extra parts gracefully', () => {
        const original = 'id,name';
        const result = FieldBuilder.removeField(original, 'name.nonexistent.path');
        expect(result).toBe(original);
      });

      it('should remove parent if last child is removed', () => {
        const original = 'id,project(custom(field1))';
        const result = FieldBuilder.removeField(original, 'project.custom.field1');
        expect(result.includes('field1')).toBeFalsy();
      });
    });

    describe('serializeFieldStructure', () => {
      it('should handle empty array', () => {
        const result = FieldBuilder.serializeFieldStructure([]);
        expect(result).toBe('');
      });

      it('should handle complex nested structure', () => {
        const structure = [
          { name: 'id' },
          { 
            name: 'project', 
            children: [
              { name: 'id' },
              { 
                name: 'custom', 
                children: [
                  { name: 'field1' },
                  { name: 'field2' }
                ]
              }
            ]
          }
        ];
        const result = FieldBuilder.serializeFieldStructure(structure);
        expect(result).toBe('id,project(id,custom(field1,field2))');
      });
    });

    describe('from', () => {
      it('should handle complex field string correctly', () => {
        const fieldString = 'id,name,project(id,name,custom(field1,field2))';
        const builder = FieldBuilder.from(fieldString);
        const result = builder.build();
        expect(result).toBe('id,name,project(id,name,custom(field1))');
      });
    });
  });
}); 