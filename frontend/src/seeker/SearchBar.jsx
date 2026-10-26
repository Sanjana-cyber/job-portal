import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

/**
 * SearchBar — Search bar component for filtering jobs.
 *
 * Props:
 *   value       — current search string (controlled)
 *   onChange    — callback fired with the new search string
 *   placeholder — placeholder text (default: "Search jobs…")
 *   variant     — "navbar" (dark bg, default) or "toolbar" (light bg)
 *   id          — optional HTML id for the input element
 */
export default function SearchBar({
  value = "",
  onChange,
  placeholder = "Search jobs by title, skill, or location…",
  variant = "navbar",
  id = "seeker-search-input",
}) {
  const inputRef = useRef(null);
  const [localValue, setLocalValue] = useState(value);

  // Keep local in sync if parent resets
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    setLocalValue(v);
    onChange?.(v);
  };

  const handleClear = () => {
    setLocalValue("");
    onChange?.("");
    inputRef.current?.focus();
  };

  const wrapperClass =
    variant === "toolbar" ? "seeker-search seeker-search--toolbar" : "seeker-search";

  return (
    <div className={wrapperClass}>
      <span className="seeker-search__icon">
        <Search size={16} />
      </span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        className="seeker-search__input"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        autoComplete="off"
      />
      {localValue && (
        <button
          className="seeker-search__clear"
          onClick={handleClear}
          aria-label="Clear search"
          type="button"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export { SearchBar as JobSearch };
