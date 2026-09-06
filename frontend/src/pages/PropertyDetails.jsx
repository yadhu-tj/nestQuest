import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiHome, FiMaximize2, FiDollarSign, FiTag, FiCalendar, FiUser, FiBriefcase, FiPhone, FiMail, FiAlertCircle, FiCheckCircle, FiAlertCircle as FiAlertCircleIcon, FiLoader, FiHeart, FiShare2, FiImage, FiStar } from 'react-icons/fi';
import { Link, useNavigate as useRouterNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import StatusBadge from '../components/Common/StatusBadge';
import { ConfirmModal } from '../components/Common/Modal';
import api, { savedPropertiesApi, getImageUrl } from '../services/api';

const DEFAULT_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"%3E%3Crect fill="%23e5e7eb" width="800" height="600"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="24" fill="%239ca3af"%3ENo Image Available%3C/text%3E%3C/svg%3E';

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role, user } = useAuth();

  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const fetchProperty = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get(`/properties/${id}`);
      setProperty(response.data.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Property not found');
      } else {
        setError(err.response?.data?.message || 'Failed to load property details');
      }
      setProperty(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchSavedStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setIsSaved(false);
      return;
    }
    try {
      const response = await savedPropertiesApi.checkStatus(id);
      setIsSaved(response.data.data?.is_saved || false);
    } catch (err) {
      console.error('Failed to check saved status:', err);
      setIsSaved(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  useEffect(() => {
    fetchSavedStatus();
  }, [fetchSavedStatus, property]);

  const handleSaveProperty = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    try {
      if (isSaved) {
        await savedPropertiesApi.unsave(id);
        setIsSaved(false);
      } else {
        await savedPropertiesApi.save(id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
      alert(err.response?.data?.message || 'Failed to update saved status');
    }
  };

  const images = property?.images && property.images.length > 0
    ? property.images.map((img) => getImageUrl(img))
    : [DEFAULT_IMAGE];

  const handleBookVisit = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    if (role !== 'user') {
      alert('Only users can book property visits. Brokers and admins cannot book visits.');
      return;
    }
    if (property?.availability_status !== 'Available') {
      alert('This property is not available for booking.');
      return;
    }
    setBookingDate('');
    setBookingError('');
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingDate) {
      setBookingError('Please select a visit date');
      return;
    }

    const selectedDate = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setBookingError('Visit date cannot be in the past');
      return;
    }

    setIsBooking(true);
    setBookingError('');

    try {
      await api.post('/bookings/', {
        property_id: property.property_id,
        visit_date: bookingDate,
      });
      setShowBookingModal(false);
      alert('Visit booked successfully! The broker will confirm your appointment.');
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to book visit. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" ariaLabel="Loading property details" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <FiAlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Property</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <FiArrowLeft className="h-5 w-5" aria-hidden="true" />
            Back to Search Results
          </Link>
        </div>
      </div>
    );
  }

  const {
    property_id,
    title,
    description,
    broker_notes,
    property_type,
    price,
    location,
    bedrooms,
    bathrooms,
    area_sqft,
    availability_status,
    created_at,
    broker_name,
    broker_company,
    broker_phone,
  } = property;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            <FiArrowLeft className="h-5 w-5" aria-hidden="true" />
            Back to Search Results
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100 relative">
                <img
                  src={images[selectedImageIndex]}
                  alt={`${title} - Image ${selectedImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === selectedImageIndex
                            ? 'bg-white'
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                        aria-label={`View image ${index + 1}`}
                        aria-current={index === selectedImageIndex ? 'true' : 'false'}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="p-4 border-t border-gray-100">
                  <div className="flex gap-3 overflow-x-auto pb-2" role="group" aria-label="Property images">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          index === selectedImageIndex
                            ? 'border-blue-500 ring-2 ring-blue-500/20'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                        aria-label={`View image ${index + 1}`}
                        aria-current={index === selectedImageIndex ? 'true' : 'false'}
                      >
                        <img
                          src={image}
                          alt={`${title} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
                  <p className="mt-1 text-gray-600 flex items-center gap-2">
                    <FiMapPin className="h-5 w-5" aria-hidden="true" />
                    {location}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={availability_status} type="availability" size="lg" />
                </div>
              </div>

              {/* Price & Type */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
                <div className="text-3xl font-bold text-gray-900">
                  ₹{Number(price).toLocaleString()}
                  <span className="text-base font-normal text-gray-500 ml-2">/ month</span>
                </div>
                {property_type && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium">
                    <FiTag className="h-4 w-4" aria-hidden="true" />
                    {property_type}
                  </span>
                )}
              </div>

              {/* Key Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {bedrooms && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FiHome className="h-6 w-6 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bedrooms</p>
                      <p className="text-xl font-bold text-gray-900">{bedrooms}</p>
                    </div>
                  </div>
                )}
                {bathrooms && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FiMaximize2 className="h-6 w-6 text-green-600" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bathrooms</p>
                      <p className="text-xl font-bold text-gray-900">{bathrooms}</p>
                    </div>
                  </div>
                )}
                {area_sqft && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FiDollarSign className="h-6 w-6 text-purple-600" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Area</p>
                      <p className="text-xl font-bold text-gray-900">{Number(area_sqft).toLocaleString()} sqft</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <FiCalendar className="h-6 w-6 text-orange-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Listed</p>
                    <p className="text-xl font-bold text-gray-900">{formatDate(created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
                </div>
              )}

              {/* Broker Notes */}
              {broker_notes && (
                <div className="mb-6 p-5 bg-blue-50 border border-blue-100 rounded-xl">
                  <h2 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <FiStar className="h-5 w-5" aria-hidden="true" />
                    Broker Notes
                  </h2>
                  <p className="text-blue-800 leading-relaxed whitespace-pre-line">{broker_notes}</p>
                </div>
              )}

              {/* Broker Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiBriefcase className="h-5 w-5 text-gray-600" aria-hidden="true" />
                  Listed by
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <FiUser className="h-6 w-6 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{broker_name || 'Unknown Broker'}</p>
                      {broker_company && (
                        <p className="text-sm text-gray-500">{broker_company}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {broker_phone && (
                      <a href={`tel:${broker_phone}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                        <FiPhone className="h-4 w-4" aria-hidden="true" />
                        {broker_phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Book Visit & Quick Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-24 space-y-6">
              {/* Price Summary */}
              <div className="border-b border-gray-100 pb-6">
                <p className="text-sm text-gray-500">Monthly Rent</p>
                <p className="text-3xl font-bold text-gray-900">₹{Number(price).toLocaleString()}</p>
              </div>

              {/* Book Visit Button */}
              {isAuthenticated && role === 'user' ? (
                <button
                  onClick={handleBookVisit}
                  disabled={availability_status !== 'Available' || isBooking}
                  className={`w-full py-4 px-6 rounded-xl text-base font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    availability_status !== 'Available'
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-lg'
                  }`}
                >
                  {isBooking ? (
                    <>
                      <FiLoader className="h-5 w-5 animate-spin mr-2" aria-hidden="true" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <FiCalendar className="h-5 w-5 mr-2" aria-hidden="true" />
                      Book Visit
                    </>
                  )}
                </button>
              ) : !isAuthenticated ? (
                <button
                  onClick={() => setShowLoginPrompt(true)}
                  className="w-full py-4 px-6 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <FiCalendar className="h-5 w-5 mr-2" aria-hidden="true" />
                  Book Visit
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-4 px-6 rounded-xl text-base font-semibold text-gray-400 bg-gray-100 cursor-not-allowed"
                >
                  <FiCalendar className="h-5 w-5 mr-2" aria-hidden="true" />
                  Book Visit
                </button>
              )}

              {availability_status !== 'Available' && (
                <p className="text-center text-sm text-gray-500">
                  This property is currently {availability_status.toLowerCase()}.
                </p>
              )}

              {/* Quick Actions */}
              <div className="border-t border-gray-100 pt-6 space-y-3">
                <button
                  onClick={handleSaveProperty}
                  disabled={!isAuthenticated}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isSaved
                      ? 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'
                      : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FiHeart className={`h-5 w-5 ${isSaved ? 'text-red-500 fill-current' : ''}`} aria-hidden="true" />
                  {isSaved ? 'Saved' : 'Save Property'}
                </button>
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiShare2 className="h-5 w-5" aria-hidden="true" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Booking Modal */}
      <ConfirmModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onConfirm={handleBookingSubmit}
        title="Book Property Visit"
        message={
          <>
            <p className="text-gray-600 mb-4">Schedule a visit for <strong>{title}</strong></p>
            <div className="mb-4">
              <label htmlFor="visit_date" className="block text-sm font-medium text-gray-700 mb-1">
                Visit Date <span className="text-red-500">*</span>
              </label>
              <input
                id="visit_date"
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              {bookingError && (
                <p className="mt-1 text-sm text-red-600" role="alert">{bookingError}</p>
              )}
            </div>
            <p className="text-sm text-gray-500">
              The broker will confirm or reschedule your visit. You'll receive a notification once confirmed.
            </p>
          </>
        }
        confirmText="Confirm Booking"
        cancelText="Cancel"
        variant="primary"
        isLoading={isBooking}
      />

      {/* Login Prompt Modal */}
      <ConfirmModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onConfirm={() => navigate('/login', { state: { from: `/property/${id}` } })}
        title="Login Required"
        message={
          <p className="text-gray-600">
            Please log in to book a property visit. You'll be redirected back here after signing in.
          </p>
        }
        confirmText="Log In"
        cancelText="Cancel"
        variant="primary"
      />
    </div>
  );
}