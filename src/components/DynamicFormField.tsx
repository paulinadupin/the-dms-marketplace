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
        <div className="dynamic-field-container">
          <label className="dynamic-field-label">
            {field.label} {field.required && '*'}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="dynamic-field-input"
          />
          {field.helpText && (
            <p className="dynamic-field-help-text">
              {field.helpText}
            </p>
          )}
        </div>
      );

    case 'number':
      return (
        <div className="dynamic-field-container">
          <label className="dynamic-field-label">
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
            className="dynamic-field-input"
          />
          {field.helpText && (
            <p className="dynamic-field-help-text">
              {field.helpText}
            </p>
          )}
        </div>
      );

    case 'textarea':
      return (
        <div className="dynamic-field-container">
          <label className="dynamic-field-label">
            {field.label} {field.required && '*'}
          </label>
          <textarea
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className="dynamic-field-textarea"
          />
          {field.helpText && (
            <p className="dynamic-field-help-text">
              {field.helpText}
            </p>
          )}
        </div>
      );

    case 'select':
      return (
        <div className="dynamic-field-container">
          <label className="dynamic-field-label">
            {field.label} {field.required && '*'}
          </label>
          <select
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={field.required}
            className="dynamic-field-select"
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
            <p className="dynamic-field-help-text">
              {field.helpText}
            </p>
          )}
        </div>
      );

    case 'multiselect':
      return (
        <div className="dynamic-field-container">
          <label className="dynamic-field-label">
            {field.label} {field.required && '*'}
          </label>
          <div className="dynamic-multiselect-container">
            {field.options?.map((option) => {
              const optValue = typeof option === 'string' ? option : option.value;
              const optLabel = typeof option === 'string' ? option : option.label;
              const isChecked = Array.isArray(value) && value.includes(optValue);

              return (
                <label
                  key={optValue}
                  className="dynamic-multiselect-option"
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
                  />
                  {optLabel}
                </label>
              );
            })}
          </div>
          {field.helpText && (
            <p className="dynamic-field-help-text">
              {field.helpText}
            </p>
          )}
        </div>
      );

    case 'checkbox':
      return (
        <div className="dynamic-field-container">
          <label className="dynamic-checkbox-label">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleChange(e.target.checked)}
            />
            <span>
              {field.label}
            </span>
          </label>
          {field.helpText && (
            <p className="dynamic-field-help-text">
              {field.helpText}
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}
