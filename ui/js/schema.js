import { state } from './state.js';

export function detectSchema() {
  const data = state.rawData;
  if (!data.length) return;

  const schema = {};

  state.columns.forEach(col => {
    // Get unique values for better type detection
    const uniqueValues = [...new Set(data.map(row => row[col]).filter(v => v != null && v !== ''))];
    
    if (uniqueValues.length === 0) {
      schema[col] = 'string';
      return;
    }

    // Check if all unique values are numbers
    if (uniqueValues.every(v => typeof v === 'number' || (!isNaN(v) && !isNaN(parseFloat(v))))) {
      schema[col] = 'number';
    }
    // Check if all unique values are booleans
    else if (uniqueValues.every(v => typeof v === 'boolean' || v === 'true' || v === 'false' || v === 'TRUE' || v === 'FALSE')) {
      schema[col] = 'boolean';
    }
    // Check if all unique values are valid dates
    else if (uniqueValues.every(v => !isNaN(Date.parse(v)) && isNaN(v))) {
      schema[col] = 'date';
    }
    else {
      schema[col] = 'string';
    }
  });

  state.schema = schema;
  console.log('Detected Schema:', state.schema);
  return schema;
}
