import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FiSearch, FiMic, FiX } from 'react-icons/fi';

const placeholderTexts = [
  'E.g. "quiet 2BHK near Infopark with good transport"',
  'E.g. "pet-friendly apartment near IT park for night shift workers"',
  'E.g. "spacious villa with garden in safe locality"',
  'E.g. "affordable studio for students near university"',
];

export default function SearchBar({
  onSearch,
  initialQuery = '',
  placeholder,
  className = '',
  disabled = false,
  showVoiceButton = false,
  onVoiceSearch,
}) {
  const [query, setQuery] = useState(initialQuery);
  const [showClear, setShowClear] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [typewriterText, setTypewriterText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);
  const typewriterTimeoutRef = useRef(null);

  const currentPlaceholder = placeholder || placeholderTexts[placeholderIndex];

  useEffect(() => {
    if (query) {
      setShowClear(true);
      return;
    }
    setShowClear(false);

    if (!isTyping && inputRef.current && document.activeElement !== inputRef.current) {
      startTypewriter();
    }
  }, [query, isTyping]);

  useEffect(() => {
    return () => {
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
      }
    };
  }, []);

  const startTypewriter = useCallback(() => {
    if (isTyping) return;
    setIsTyping(true);
    setTypewriterText('');

    const text = currentPlaceholder;
    let charIndex = 0;

    const typeChar = () => {
      if (charIndex <= text.length) {
        setTypewriterText(text.slice(0, charIndex));
        charIndex++;
        typewriterTimeoutRef.current = setTimeout(typeChar, 50);
      } else {
        setIsTyping(false);
        typewriterTimeoutRef.current = setTimeout(() => {
          setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
        }, 2000);
      }
    };

    typeChar();
  }, [currentPlaceholder, isTyping]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }
    setIsTyping(false);
    setTypewriterText('');
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed && onSearch) {
      onSearch(trimmed);
    }
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setShowClear(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleFocus = useCallback(() => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }
    setIsTyping(false);
    setTypewriterText('');
  }, []);

  const handleBlur = useCallback(() => {
    if (!query) {
      setTimeout(startTypewriter, 500);
    }
  }, [query, startTypewriter]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`} role="search">
      <label htmlFor="search-input" className="sr-only">
        Natural language property search
      </label>
      <div className="relative flex items-center">
        <FiSearch className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none" aria-hidden="true" />
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={typewriterText || currentPlaceholder}
          disabled={disabled}
          className={`
            w-full pl-12 pr-12 py-4 text-base text-gray-900 placeholder-gray-400
            bg-white border border-gray-300 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            hover:border-gray-400 transition-all duration-200
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${disabled ? '' : 'shadow-sm hover:shadow-md'}
          `}
          aria-label="Search for properties using natural language"
          aria-describedby="search-hint"
        />
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Clear search query"
          >
            <FiX className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        {showVoiceButton && onVoiceSearch && (
          <button
            type="button"
            onClick={onVoiceSearch}
            disabled={disabled}
            className="absolute right-4 p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Voice search"
          >
            <FiMic className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <button
          type="submit"
          disabled={disabled || !query.trim()}
          className={`
            absolute right-4 p-3 rounded-xl text-white font-medium transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${!query.trim() || disabled
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }
          `}
          aria-label="Search"
        >
          <FiSearch className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <p id="search-hint" className="sr-only">
        Type your property requirements in natural language and press Enter or click Search
      </p>
    </form>
  );
}

export function SearchBarWithResults({
  onSearch,
  isLoading,
  initialQuery = '',
  className = '',
}) {
  const [query, setQuery] = useState(initialQuery);

  const handleSearch = useCallback((searchQuery) => {
    setQuery(searchQuery);
    onSearch?.(searchQuery);
  }, [onSearch]);

  return (
    <div className={className}>
      <SearchBar
        onSearch={handleSearch}
        initialQuery={query}
        disabled={isLoading}
      />
      {isLoading && (
        <div className="mt-4 flex items-center justify-center" role="status" aria-live="polite">
          <span className="sr-only">Searching for properties...</span>
        </div>
      )}
    </div>
  );
}