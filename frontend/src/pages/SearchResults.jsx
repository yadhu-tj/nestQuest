import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiLoader, FiHome, FiAlertCircle, FiInfo, FiStar } from 'react-icons/fi';
import SearchBar from '../components/Search/SearchBar';
import PropertyCard from '../components/Common/PropertyCard';
import AIExplanation from '../components/Search/AIExplanation';
import LoadingSpinner, { LoadingOverlay } from '../components/Common/LoadingSpinner';
import api from '../services/api';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setSearchParams({ q: searchQuery });
    setIsLoading(true);
    setError('');
    setMessage('');
    setResults([]);

    try {
      const response = await api.post('/search/', { query: searchQuery });
      const data = response.data.data;

      setResults(data.results || []);
      setCount(data.count || 0);
      setMessage(data.message || '');
    } catch (err) {
      const message = err.response?.data?.message || 'Search failed. Please try again.';
      setError(message);
      setResults([]);
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [setSearchParams]);

  // Perform search on initial load if query exists in URL
  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, []); // Only run once on mount

  const handleSearch = (searchQuery) => {
    performSearch(searchQuery);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setCount(0);
    setMessage('');
    setError('');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar Section */}
        <section className="mb-8" aria-labelledby="search-heading">
          <h1 id="search-heading" className="sr-only">Search Results</h1>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <SearchBar
              onSearch={handleSearch}
              initialQuery={query}
              disabled={isLoading}
              showVoiceButton={false}
            />
            {query && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing <strong>{count}</strong> result{count !== 1 ? 's' : ''} for
                  <span className="text-blue-600 ml-1">"{query}"</span>
                </p>
                <button
                  onClick={clearSearch}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  aria-label="Clear search"
                >
                  <FiSearch className="h-4 w-4" aria-hidden="true" />
                  New Search
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Results Section */}
        <section aria-live="polite" aria-label="Search results">
          {isLoading ? (
            <LoadingOverlay isLoading={true} size="lg" ariaLabel="Searching for properties">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-gray-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-10 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </LoadingOverlay>
          ) : error ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <FiAlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Search Failed</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => performSearch(query)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiSearch className="h-4 w-4" aria-hidden="true" />
                Try Again
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <FiHome className="h-12 w-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {query ? 'No properties found' : 'Start your search'}
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {query
                  ? `We couldn't find any properties matching "${query}". Try different keywords or broader search terms.`
                  : 'Enter a natural language query above to find your perfect property.'}
              </p>
              {message && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto text-sm text-blue-800">
                  <FiInfo className="h-4 w-4 inline mr-1" aria-hidden="true" />
                  {message}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {count} Result{count !== 1 ? 's' : ''} Found
                  </h2>
                  {message && (
                    <p className="text-sm text-gray-500 mt-1">{message}</p>
                  )}
                </div>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="list" aria-label="Property search results">
                {results.map((property) => (
                  <article key={property.property_id} role="listitem" className="group">
                    <PropertyCard property={property} />
                    <AIExplanation
                      explanation={property.ai_explanation}
                      className="mt-3"
                    />
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}