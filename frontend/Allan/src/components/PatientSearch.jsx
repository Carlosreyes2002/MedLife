import { useEffect, useId, useRef, useState } from 'react';

const normalize = (text) => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

export default function PatientSearch({
  patients,
  value,
  onChange,
  placeholder = 'Buscar paciente por nombre...',
  disabled = false,
  allowClear = true,
  error,
  id: idProp,
}) {
  const autoId = useId();
  const inputId = idProp || autoId;
  const listId = `${inputId}-list`;
  const containerRef = useRef(null);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selected = patients.find((p) => String(p.id) === String(value));

  useEffect(() => {
    if (selected) {
      setQuery(selected.name);
    } else if (!value) {
      setQuery('');
    }
  }, [selected, value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmed = query.trim();
  const matches =
    trimmed.length === 0
      ? patients.slice(0, 8)
      : patients.filter((p) => normalize(p.name).includes(normalize(trimmed))).slice(0, 8);

  const handleInputChange = (e) => {
    const next = e.target.value;
    setQuery(next);
    setOpen(true);
    if (value) {
      onChange('');
    }
  };

  const handleSelect = (patient) => {
    onChange(String(patient.id));
    setQuery(patient.name);
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
    setOpen(false);
  };

  const handleFocus = () => {
    if (!disabled) setOpen(true);
  };

  return (
    <div
      className={`patient-search${error ? ' patient-search--error' : ''}`}
      ref={containerRef}
    >
      <div className="patient-search__input-wrap">
        <svg
          className="patient-search__icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          id={inputId}
          type="search"
          className="patient-search__input"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
        />
        {allowClear && (query || value) && !disabled && (
          <button
            type="button"
            className="patient-search__clear"
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
          >
            ×
          </button>
        )}
      </div>

      {open && !disabled && matches.length > 0 && (
        <ul id={listId} className="patient-search__results" role="listbox">
          {matches.map((patient) => (
            <li key={patient.id} role="option">
              <button
                type="button"
                className={`patient-search__option${
                  String(patient.id) === String(value) ? ' patient-search__option--active' : ''
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(patient)}
              >
                <span className="patient-search__name">{patient.name}</span>
                {patient.email && (
                  <span className="patient-search__meta">{patient.email}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !disabled && trimmed.length > 0 && matches.length === 0 && (
        <p className="patient-search__empty">No se encontraron pacientes</p>
      )}

      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
