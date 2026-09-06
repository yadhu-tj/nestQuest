import React from 'react';
import { FiInfo, FiCheckCircle, FiAlertCircle, FiStar } from 'react-icons/fi';

export default function AIExplanation({ explanation, className = '' }) {
  if (!explanation) {
    return (
      <div
        className={`flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex-shrink-0 mt-0.5">
          <FiAlertCircle className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700">AI Explanation Unavailable</p>
          <p className="mt-1 text-sm text-gray-500">
            We couldn't generate a personalized explanation for this match. The property details
            above should still help you evaluate if it meets your needs.
          </p>
        </div>
        <FiStar className="flex-shrink-0 mt-0.5 h-5 w-5 text-gray-300" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex-shrink-0 mt-0.5">
        <FiCheckCircle className="h-5 w-5 text-blue-600" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-900">Why this matches your search</p>
        <p className="mt-1 text-sm text-blue-800 leading-relaxed">{explanation}</p>
      </div>
      <FiStar className="flex-shrink-0 mt-0.5 h-5 w-5 text-blue-400" aria-hidden="true" />
    </div>
  );
}

export function AIExplanationCard({ property, className = '' }) {
  const { ai_explanation, title } = property;

  return (
    <div className={className}>
      <h4 className="text-sm font-semibold text-gray-900 mb-3">AI Match Explanation</h4>
      <AIExplanation explanation={ai_explanation} />
    </div>
  );
}

export function AIExplanationList({ properties, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`} role="list" aria-label="AI match explanations">
      {properties.map((property) => (
        <div key={property.property_id} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiInfo className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <h4 className="text-sm font-semibold text-gray-900">Why this matches: {property.title}</h4>
          </div>
          <AIExplanation explanation={property.ai_explanation} />
        </div>
      ))}
    </div>
  );
}