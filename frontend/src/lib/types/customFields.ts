
export type FieldType = 'text' | 'date' | 'number' | 'boolean' | 'select' | 'textarea';

export interface CustomFieldDefinition {
    id?: number;
    user_id?: number;
    entity_type: string; // 'asset', 'contact', etc.
    name: string;
    field_type: FieldType;
    options?: string; // JSON string for select options
    order?: number;
    created_at?: string;
}

export interface CustomAttributeValue {
    [key: string]: any;
}
