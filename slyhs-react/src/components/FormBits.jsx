/* Small form building blocks for the registration form. */

export function Field({ name, label, error, hint, hidden, children }) {
  if (hidden) return null;
  return (
    <div className={'field' + (error ? ' has-error' : '')} data-field={name}>
      {label && <label htmlFor={name} id={`${name}-label`}>{label}</label>}
      {children}
      {hint && <span className="hint">{hint}</span>}
      {error && error !== 'Required' && <span className="err">{error}</span>}
    </div>
  );
}

export function TextInput({ name, value, onChange, error, ...rest }) {
  return <input id={name} name={name} value={value} aria-invalid={!!error} onChange={(e) => onChange(name, e.target.value)} {...rest} />;
}

export { default as Select } from './GlassSelect';
export { default as DatePicker } from './GlassDate';

export function Chips({ name, label, hint, options, value, multi, onChange, error }) {
  const labelId = 'lbl-' + name;
  const toggle = (opt) => {
    if (multi) onChange(name, value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt]);
    else onChange(name, opt);
  };
  return (
    <div className={'field' + (error ? ' has-error' : '')} data-field={name}>
      <span className="group-label" id={labelId}>{label}{hint && <em>{hint}</em>}</span>
      <div className="chips" role={multi ? 'group' : 'radiogroup'} aria-labelledby={labelId}>
        {options.map((opt) => (
          <label className="chip-opt" key={opt}>
            <input type={multi ? 'checkbox' : 'radio'} name={name} value={opt}
              checked={multi ? value.includes(opt) : value === opt} onChange={() => toggle(opt)} />
            <span>{opt}</span>
          </label>
        ))}
      </div>
      {error && <span className="err">{error}</span>}
    </div>
  );
}

export function Check({ name, checked, onChange, error, children }) {
  return (
    <label className={'check' + (error ? ' has-error' : '')} data-field={name}>
      <input type="checkbox" name={name} checked={checked} aria-invalid={!!error} onChange={(e) => onChange(name, e.target.checked)} />
      <span className="box" aria-hidden="true" />
      <span>{children}</span>
    </label>
  );
}
