/**
 * Utility functions for parsing and serializing YouTrack field strings
 */
export interface FieldNode {
  name: string;
  children?: FieldNode[];
}

/**
 * Builder class for creating field strings
 */
export class FieldBuilder {
  public rootFields: FieldNode[] = [];

  /**
   * Create a new FieldBuilder
   * @param fieldString - Optional serialized field string to initialize with
   */
  constructor(fieldString?: string) {
    if (fieldString) {
      this.rootFields = FieldBuilder.parseFieldString(fieldString);
    }
  }

  /**
   * Parse a YouTrack field string into a structured object
   * @param fieldString - The field string to parse
   * @returns The parsed field structure
   */
  public static parseFieldString(fieldString: string): FieldNode[] {
    let current = 0;
    
    function parseFields(): FieldNode[] {
      const fields: FieldNode[] = [];
      let fieldName = '';
      
      while (current < fieldString.length) {
        const char = fieldString[current];
        
        if (char === '(') {
          // Start of children
          current++; // Skip the opening parenthesis
          const children = parseFields();
          fields.push({ name: fieldName.trim(), children });
          fieldName = '';
        } else if (char === ')') {
          // End of current level
          current++; // Skip the closing parenthesis
          return fields;
        } else if (char === ',') {
          // Field separator
          if (fieldName.trim()) {
            fields.push({ name: fieldName.trim() });
          }
          fieldName = '';
          current++;
        } else {
          // Part of field name
          fieldName += char;
          current++;
        }
      }
      
      // Add the last field if any
      if (fieldName.trim()) {
        fields.push({ name: fieldName.trim() });
      }
      
      return fields;
    }
    
    return parseFields();
  }

  /**
   * Serialize a field structure back to a YouTrack field string
   * @param fields - The field structure to serialize
   * @returns The serialized field string
   */
  public static serializeFieldStructure(fields: FieldNode[]): string {
    return fields.map(field => {
      if (!field.children || field.children.length === 0) {
        return field.name;
      }
      return `${field.name}(${FieldBuilder.serializeFieldStructure(field.children)})`;
    }).join(',');
  }

  /**
   * Add a field to an existing field string
   * @param fieldString - The original field string
   * @param path - Path to the parent field, separated by dots (e.g., "project.fields")
   * @param newField - The new field to add
   * @returns The updated field string
   */
  public static addField(fieldString: string, path: string, newField: string): string {
    const fields = FieldBuilder.parseFieldString(fieldString);
    
    function findAndAddField(nodes: FieldNode[], pathParts: string[]): boolean {
      if (pathParts.length === 0) {
        return false;
      }
      
      const currentPath = pathParts[0];
      const remainingPath = pathParts.slice(1);
      
      for (const node of nodes) {
        if (node.name === currentPath) {
          if (remainingPath.length === 0) {
            // We've found the target node, add the new field
            const newFieldParts = FieldBuilder.parseFieldString(newField);
            if (!node.children) {
              node.children = [];
            }
            node.children.push(...newFieldParts);
            return true;
          } else {
            // Continue down the path
            if (!node.children) {
              node.children = [];
            }
            return findAndAddField(node.children, remainingPath);
          }
        }
      }
      
      return false;
    }
    
    const pathParts = path.split('.');
    findAndAddField(fields, pathParts);
    
    return FieldBuilder.serializeFieldStructure(fields);
  }

  /**
   * Remove a field from an existing field string
   * @param fieldString - The original field string
   * @param fieldPath - Full path to the field to remove, separated by dots
   * @returns The updated field string
   */
  public static removeField(fieldString: string, fieldPath: string): string {
    const fields = FieldBuilder.parseFieldString(fieldString);
    const pathParts = fieldPath.split('.');
    
    function findAndRemoveField(nodes: FieldNode[], parts: string[], index: number): boolean {
      if (index >= parts.length) return false;
      
      const currentPart = parts[index];
      const isLastPart = index === parts.length - 1;
      
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].name === currentPart) {
          if (isLastPart) {
            // Found the field to remove
            nodes.splice(i, 1);
            return true;
          } else {
            // Continue searching in children
            if (!nodes[i].children) {
              return false;
            }
            return findAndRemoveField(nodes[i].children!, parts, index + 1);
          }
        }
      }
      
      return false;
    }
    
    findAndRemoveField(fields, pathParts, 0);
    return FieldBuilder.serializeFieldStructure(fields);
  }

  /**
   * Add a field to the builder
   * @param field - Field name or path (dot notation for nested fields)
   * @returns The builder instance for chaining
   */
  public add(field: string): FieldBuilder {
    if (!field) return this;

    // If the field contains dots, it's a nested field
    if (field.includes('.')) {
      this.addNestedField(field);
    } else {
      // Check if this field already exists at the root level
      const exists = this.rootFields.some(node => node.name === field);
      
      // Only add if it doesn't already exist
      if (!exists) {
        // Simple field without children
        this.rootFields.push({ name: field });
      }
    }
    return this;
  }

  /**
   * Add multiple fields at once
   * @param fields - Array of field names or paths
   * @returns The builder instance for chaining
   */
  public addFields(fields: string[]): FieldBuilder {
    fields.forEach(field => this.add(field));
    return this;
  }

  /**
   * Parse an existing field string and add it to the builder
   * @param fieldString - The field string to parse and add
   * @returns The builder instance for chaining
   */
  public addFieldString(fieldString: string): FieldBuilder {
    const parsedFields = FieldBuilder.parseFieldString(fieldString);
    
    // Add each field individually to ensure deduplication
    parsedFields.forEach(field => {
      const exists = this.rootFields.some(node => node.name === field.name);
      if (!exists) {
        this.rootFields.push(field);
      }
    });
    
    return this;
  }

  /**
   * Build the final field string
   * @returns The constructed field string
   */
  public build(): string {
    return FieldBuilder.serializeFieldStructure(this.rootFields);
  }

  /**
   * Add a nested field using dot notation
   * @param fieldPath - The field path (e.g., "project.name.fullName")
   */
  private addNestedField(fieldPath: string): void {
    const parts = fieldPath.split('.');
    let currentLevel = this.rootFields;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}.${part}` : part;
      
      // Check if this part already exists at the current level
      let existingNode = currentLevel.find(node => node.name === part);
      
      if (!existingNode) {
        // Create new node if it doesn't exist
        existingNode = { name: part, children: [] };
        currentLevel.push(existingNode);
      }
      
      // Move to the next level
      if (!existingNode.children) {
        existingNode.children = [];
      }
      currentLevel = existingNode.children;
    }
  }

  /**
   * Create a new builder from an existing field string
   * @param fieldString - The existing field string
   * @returns A new FieldBuilder with the parsed fields
   */
  public static from(fieldString: string): FieldBuilder {
    const builder = new FieldBuilder();
    builder.rootFields = FieldBuilder.parseFieldString(fieldString);
    return builder;
  }
} 

// Export helper functions as standalone for backward compatibility
export const parseFieldString = FieldBuilder.parseFieldString;
export const serializeFieldStructure = FieldBuilder.serializeFieldStructure;
export const addField = FieldBuilder.addField;
export const removeField = FieldBuilder.removeField; 