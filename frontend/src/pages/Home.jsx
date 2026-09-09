import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiHome, FiShield, FiUsers, FiStar, FiMapPin, FiTrendingUp, FiAward, FiArrowRight } from 'react-icons/fi';
import SearchBar from '../components/Search/SearchBar';
import PropertyCard from '../components/Common/PropertyCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import api from '../services/api';

const features = [
  {
    icon: FiSearch,
    title: 'Natural Language Search',
    description: 'Describe your ideal home in plain English. No filters, no dropdowns — just tell us what you\'re looking for.',
  },
  {
    icon: FiStar,
    title: 'AI-Powered Matching',
    description: 'Our RAG pipeline understands context and intent, matching you with properties that truly fit your lifestyle.',
  },
  {
    icon: FiShield,
    title: 'Verified Listings',
    description: 'Every property is listed by verified brokers with detailed notes, photos, and availability status.',
  },
  {
    icon: FiUsers,
    title: 'Personalized Explanations',
    description: 'Get AI-generated explanations for why each property matches your specific requirements.',
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Describe Your Needs',
    description: 'Type a natural language query like "quiet 2BHK near Infopark for night shift workers"',
  },
  {
    step: '02',
    title: 'AI Understands Context',
    description: 'Our system analyzes your intent, not just keywords, using semantic search and LLM reasoning.',
  },
  {
    step: '03',
    title: 'Get Matched Results',
    description: 'Receive ranked properties with personalized AI explanations for each match.',
  },
  {
    step: '04',
    title: 'Book a Visit',
    description: 'Schedule a property visit directly through the platform. Brokers confirm or reschedule.',
  },
];

export default function Home() {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [propertiesError, setPropertiesError] = useState('');

  const handleSearch = (query) => {
    // Navigate to search results page with query
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        const response = await api.get('/properties/?availability_status=Available');
        const properties = response.data.data || [];
        // Get first 4 available properties for featured section
        setFeaturedProperties(properties.slice(0, 4));
      } catch (error) {
        console.error('Failed to load featured properties:', error);
        setPropertiesError('Unable to load featured properties');
      } finally {
        setIsLoadingProperties(false);
      }
    };

    fetchFeaturedProperties();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Find Your Perfect Home with{' '}
              <span className="text-blue-600">Natural Language</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
              Describe what you\'re looking for in your own words. Our AI understands context, lifestyle needs,
              and preferences to match you with the right properties.
            </p>

            {/* Search Bar */}
            <div className="mt-10 max-w-2xl mx-auto">
              <SearchBar
                onSearch={handleSearch}
                placeholder='E.g. "pet-friendly 2BHK near Infopark with good transport for night shift workers"'
                showVoiceButton={false}
              />
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Try: <span className="font-medium text-gray-700">"spacious villa with garden in safe locality"</span> or{' '}
              <span className="font-medium text-gray-700">"affordable studio for students near university"</span>
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" aria-hidden="true" />
      </section>

      {/* Featured Properties */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Properties</h2>
              <p className="mt-2 text-gray-600">Curated selections from our verified brokers</p>
            </div>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              View All Properties
              <FiArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {isLoadingProperties ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="status" aria-live="polite">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : propertiesError ? (
            <div className="text-center py-12">
              <FiSearch className="h-12 w-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-lg font-medium text-gray-900">Unable to load properties</h3>
              <p className="mt-2 text-gray-600">{propertiesError}</p>
            </div>
          ) : featuredProperties.length === 0 ? (
            <div className="text-center py-12">
              <FiHome className="h-12 w-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-lg font-medium text-gray-900">No properties available</h3>
              <p className="mt-2 text-gray-600">Check back later for new listings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.property_id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Four simple steps to find your ideal property using conversational search
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center p-6">
                <div className="mx-auto mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 font-bold text-2xl">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose NestQuest?</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Built for modern home seekers who want more than just filters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-100 text-blue-600 mb-4">
                  <feature.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Find Your Perfect Match?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of home seekers who found their ideal property using natural language search.
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
          >
            Start Searching Now
            <FiArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-1">20+</div>
              <div className="text-gray-600">Verified Properties</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-1">100%</div>
              <div className="text-gray-600">Broker Verified</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-1">AI</div>
              <div className="text-gray-600">Powered Search</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-1">24/7</div>
              <div className="text-gray-600">Availability</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}