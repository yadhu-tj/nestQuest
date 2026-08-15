import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchService } from '../services/searchService';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;

      setLoading(true);
      setError('');
      try {
        const response = await searchService.searchProperties(query);
        if (response.success) {
          setResults(response.data.results || []);
        } else {
          setError(response.message || 'Failed to fetch results');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while searching');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Search Results</h1>
      <p className="mb-8 text-gray-600">Showing results for: <span className="font-semibold">"{query}"</span></p>

      {loading && <p className="text-blue-500">Thinking and searching properties...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && results.length === 0 && (
        <p className="text-gray-500">No properties matched your search. Try different keywords.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((property) => (
          <div key={property.property_id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">{property.title}</h2>
            <p className="text-gray-600 mb-2">{property.location} • ₹{property.price}</p>
            <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded mb-2">
              <span className="font-semibold text-blue-800">AI Match: </span>
              {property.ai_explanation || 'Good match based on your criteria.'}
            </div>
            <a href={`/properties/${property.property_id}`} className="text-blue-600 hover:underline mt-2 inline-block">View Details →</a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
