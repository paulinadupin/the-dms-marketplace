import type { FieldConfig } from '../config/item-fields.config';

interface DynamicFormFieldProps {
  field: FieldConfig;
  value: any;
  onChange: (name: string, value: any) => void;
}

/**
 * Dynamic form field component that renders based on field configuration
 * Supports: text, number, select, multiselect, checkbox, textarea
 */
export function DynamicFormField({ field, value, onChange }: DynamicFormFieldProps) {
  const handleChange = (newValue: any) => {
    onChange(field.name, newValue);
  };

  // Render based on field type
  switch (field.type) {
    case 'text':
      return (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {field.label} {field.required && '*'}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px'
            }}
          />
          {field.helpText && (
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
              {field.helpText}
            </p>
          )}
        </div>
      );

    case 'number':
      return (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {field.label} {field.required && '*'}
          </label>
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder={field.placeholder}
            required={field.required}
            min={field.min}
            max={field.max}
            step={field.step || 1}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px'
            }}
          />
          {field.helpText && (
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
              {field.helpText}
            </p>
          )}
        </div>
      );

    case 'textarea':
      return (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {field.label} {field.required && '*'}
          </label>
          <textarea
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
          {field.helpText && (
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
              {field.helpText}
            </p>
          )}
        </div>
      );

    case 'select':
      return (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {field.label} {field.required && '*'}
          </label>
          <select
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={field.required}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px'
            }}
          >
            <option value="">-- Select {field.label} --</option>
            {field.options?.map((option) => {
              const optValue = typeof option === 'string' ? option : option.value;
              const optLabel = typeof option === 'string' ? option : option.label;
              return (
                <option key={optValue} value={optValue}>
                  {optLabel}
                </option>
              );
            })}
          </select>
          {field.helpText && (
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
              {field.helpText}
            </p>
          )}
        </div>
      );

    case 'multiselect':
      return (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {field.label} {field.required && '*'}
          </label>
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '5px',
            padding: '10px',
            maxHeight: '150px',
            overflowY: 'auto',
            backgroundColor: 'white'
          }}>
            {field.options?.map((option) => {
              const optValue = typeof option === 'string' ? option : option.value;
              const optLabel = typeof option === 'string' ? option : option.label;
              const isChecked = Array.isArray(value) && value.includes(optValue);

              return (
                <label
                  key={optValue}
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        handleChange([...currentValues, optValue]);
                      } else {
                        handleChange(currentValues.filter((v: string) => v !== optValue));
                      }
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  {optLabel}
                </label>
              );
            })}
          </div>
          {field.helpText && (
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
              {field.helpText}
            </p>
          )}
        </div>
      );

    case 'checkbox':
      return (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleChange(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontWeight: 'bold' }}>
              {field.label}
            </span>
          </label>
          {field.helpText && (
            <p style={{ margin: '5px 0 0 26px', fontSize: '12px', color: '#999' }}>
              {field.helpText}
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}
