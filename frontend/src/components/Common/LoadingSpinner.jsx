import React from 'react';

export default function LoadingSpinner({ size = 'md', className = '', ariaLabel = 'Loading' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4',
  };

  const containerClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  return (
    <div
      className={`flex items-center justify-center ${containerClasses[size]} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <div
        className={`${sizeClasses[size]} rounded-full border-blue-200 border-t-blue-600 animate-spin`}
        aria-hidden="true"
      />
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}

export function LoadingOverlay({ isLoading, children, size = 'md', ariaLabel = 'Loading content' }) {
  if (!isLoading) return children;

  return (
    <div className="relative min-h-[100px]">
      {children}
      <div
        className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10"
        aria-live="polite"
        aria-label={ariaLabel}
      >
        <LoadingSpinner size={size} ariaLabel={ariaLabel} />
      </div>
    </div>
  );
}