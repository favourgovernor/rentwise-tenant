// src/components/FormField.tsx

interface FormFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  locked?: boolean;
  optional?: boolean;
  required?: boolean;
}

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  locked = false,
  optional = false,
}: FormFieldProps) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label className="label">
        {label}
        {optional && (
          <span style={{ color: 'var(--text-light)', fontWeight: 400 }}> (optional)</span>
        )}
      </label>
      <input
        className="input-field"
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={locked}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {locked && (
        <p style={{ fontSize: 11.5, color: 'var(--text-light)', marginTop: 4 }}>
          Set by your landlord
        </p>
      )}
    </div>
  );
}
