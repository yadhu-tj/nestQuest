import React, { useState, useEffect, useCallback } from 'react';
import { FiUser, FiCalendar, FiHome, FiMapPin, FiAlertCircle, FiCheckCircle, FiXCircle, FiLoader, FiLogOut, FiEdit, FiSettings, FiBell, FiHeart, FiTrash2, FiEye, FiSearch, FiMaximize2, FiMail, FiX, FiPhone } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import StatusBadge from '../components/Common/StatusBadge';
import { ConfirmModal } from '../components/Common/Modal';
import api, { savedPropertiesApi, getImageUrl } from '../services/api';

const STATUS_ORDER = { Pending: 0, Confirmed: 1, Completed: 2, Cancelled: 3 };

function UserDashboard() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('bookings');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [savedProperties, setSavedProperties] = useState([]);
  const [isSavedLoading, setIsSavedLoading] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSuccess, setProfileSuccess] = useState('');

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/bookings/');
      setBookings(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSavedProperties = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsSavedLoading(true);
    try {
      const response = await savedPropertiesApi.getAll();
      setSavedProperties(response.data.data || []);
    } catch (err) {
      console.error('Failed to load saved properties:', err);
      setSavedProperties([]);
    } finally {
      setIsSavedLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
      fetchSavedProperties();
    }
  }, [isAuthenticated, fetchBookings, fetchSavedProperties]);

  const handleCancelBooking = (booking) => {
    setBookingToCancel(booking);
    setShowCancelModal(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;

    setIsCancelling(true);
    try {
      await api.patch(`/bookings/${bookingToCancel.booking_id}/status`, {
        status: 'Cancelled',
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.booking_id === bookingToCancel.booking_id ? { ...b, status: 'Cancelled' } : b
        )
      );
      setShowCancelModal(false);
      setBookingToCancel(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUnsaveProperty = async (savedProperty) => {
    if (!window.confirm('Are you sure you want to remove this property from your saved list?')) {
      return;
    }
    try {
      await savedPropertiesApi.unsave(savedProperty.property.property_id);
      setSavedProperties(prev => prev.filter(p => p.saved_id !== savedProperty.saved_id));
    } catch (err) {
      console.error('Failed to unsave property:', err);
      alert(err.response?.data?.message || 'Failed to remove saved property');
    }
  };

  const handleBookViewing = (property) => {
    // Navigate to property details page to book a viewing
    navigate(`/property/${property.property_id}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <FiAlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'Confirmed':
        return <FiCheckCircle className="h-4 w-4 text-green-600" />;
      case 'Completed':
        return <FiCheckCircle className="h-4 w-4 text-blue-600" />;
      case 'Cancelled':
        return <FiXCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FiAlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const openEditProfileModal = () => {
    setProfileFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
    setProfileErrors({});
    setProfileSuccess('');
    setShowEditProfileModal(true);
  };

  const closeEditProfileModal = () => {
    setShowEditProfileModal(false);
    setProfileErrors({});
    setProfileSuccess('');
  };

  const validateProfileForm = () => {
    const errors = {};
    if (!profileFormData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!profileFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileFormData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!profileFormData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (profileFormData.phone.length < 7 || profileFormData.phone.length > 15) {
      errors.phone = 'Phone number must be between 7 and 15 digits';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(profileFormData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    return errors;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    
    const errors = validateProfileForm();
    setProfileErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsEditingProfile(true);
    try {
      const response = await api.put('/auth/profile', profileFormData);
      setProfileSuccess('Profile updated successfully!');
      // Update the user in auth context by re-fetching
      // For now, we'll just update the local user state
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setProfileErrors({ submit: message });
    } finally {
      setIsEditingProfile(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const sortedBookings = React.useMemo(() => {
    return [...bookings].sort((a, b) => {
      const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (statusDiff !== 0) return statusDiff;
      return new Date(b.booking_date) - new Date(a.booking_date);
    });
  }, [bookings]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" ariaLabel="Loading dashboard" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <FiUser className="h-16 w-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Please Log In</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to view your dashboard.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <FiLogOut className="h-5 w-5" aria-hidden="true" />
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const pendingCount = bookings.filter((b) => b.status === 'Pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'Confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'Completed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'User'}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Notifications">
                <FiBell className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Settings">
                <FiSettings className="h-5 w-5" />
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <FiLogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <FiAlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Visits</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <FiCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Confirmed Visits</p>
                <p className="text-2xl font-bold text-gray-900">{confirmedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiCheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Visits</p>
                <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" aria-label="Dashboard tabs">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'bookings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiCalendar className="h-5 w-5 inline mr-2" />
                Bookings
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiUser className="h-5 w-5 inline mr-2" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'saved'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiHeart className="h-5 w-5 inline mr-2" />
                Saved Properties
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'bookings' && (
              <BookingTab
                bookings={sortedBookings}
                isLoading={isLoading}
                error={error}
                onCancel={handleCancelBooking}
                formatDate={formatDate}
                formatDateTime={formatDateTime}
                getStatusIcon={getStatusIcon}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileTab user={user} onLogout={logout} />
            )}

            {activeTab === 'saved' && (
              <SavedPropertiesTab
                savedProperties={savedProperties}
                isSavedLoading={isSavedLoading}
                onUnsave={handleUnsaveProperty}
                onBookViewing={handleBookViewing}
              />
            )}
          </div>
        </div>
      </main>

      {/* Cancel Booking Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setBookingToCancel(null);
        }}
        onConfirm={confirmCancelBooking}
        title="Cancel Booking"
        message={
          bookingToCancel ? (
            <>
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel your visit to <strong>{bookingToCancel.property_title}</strong>?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p><strong>Property:</strong> {bookingToCancel.property_title}</p>
                <p><strong>Visit Date:</strong> {formatDate(bookingToCancel.visit_date)}</p>
                <p><strong>Current Status:</strong>{' '}
                  <StatusBadge status={bookingToCancel.status} type="booking" size="sm" showDot={false} />
                </p>
              </div>
            </>
          ) : (
            <p className="text-gray-600">Please select a booking to cancel.</p>
          )
        }
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        variant="danger"
        isLoading={isCancelling}
      />
    </div>
  );
}

function BookingTab({ bookings, isLoading, error, onCancel, formatDate, formatDateTime, getStatusIcon }) {
  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load bookings</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16">
        <FiCalendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          You haven't booked any property visits yet. Start searching for your perfect home!
        </p>
        <Link
          to="/search"
          className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <FiSearch className="h-5 w-5" />
          Search Properties
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="list" aria-label="Your bookings">
      {bookings.map((booking) => (
        <article key={booking.booking_id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow" role="listitem">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiHome className="h-8 w-8 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{booking.property_title || 'Unknown Property'}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <FiMapPin className="h-3.5 w-3.5" />
                    {booking.property_location || 'Unknown location'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-3 sm:flex-row">
                <div className="flex items-center gap-3">
                  {getStatusIcon(booking.status)}
                  <StatusBadge status={booking.status} type="booking" size="md" showDot={false} />
                </div>
                <div className="text-right sm:text-right">
                  <p className="text-sm text-gray-500">Booked</p>
                  <p className="font-medium text-gray-900">{formatDateTime(booking.booking_date)}</p>
                </div>
                <div className="text-right sm:text-right">
                  <p className="text-sm text-gray-500">Visit Date</p>
                  <p className="font-medium text-gray-900">{formatDate(booking.visit_date)}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link
                    to={`/property/${booking.property_id}`}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
                  >
                    View Property
                  </Link>
                  {booking.status === 'Pending' && (
                    <button
                      onClick={() => onCancel(booking)}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-center"
                    >
                      Cancel
                    </button>
                  )}
                  {booking.status === 'Confirmed' && (
                    <button
                      onClick={() => onCancel(booking)}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-center"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <FiCalendar className="h-4 w-4" />
                <span>Booked on {formatDateTime(booking.booking_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCalendar className="h-4 w-4" />
                <span>Visit scheduled for {formatDate(booking.visit_date)}</span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function ProfileTab({ user, onLogout }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Please enter a valid email address';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    else if (formData.phone.length < 7 || formData.phone.length > 15) errors.phone = 'Phone number must be between 7 and 15 digits';
    else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) errors.phone = 'Please enter a valid phone number';
    return errors;
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setErrors({});
    setSuccess('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsEditing(true);
    try {
      await api.put('/auth/profile', { name: formData.name.trim(), email: formData.email.trim(), phone: formData.phone.trim() });
      // Refresh user data
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const openEditModal = () => {
    setFormData({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
    setErrors({});
    setShowEditModal(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <FiUser className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{user?.name || 'User'}</p>
              <p className="text-gray-500">{user?.email || 'user@example.com'}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user?.email || '—'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{user?.phone || '—'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium text-gray-900">{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '—'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium text-gray-900 capitalize">{user?.role || 'user'}</p>
            </div>
          </div>
        </div>
        <div className="pt-6 border-t border-gray-100">
          <button
            onClick={() => openEditModal()}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-gray-900">Edit Profile</span>
            <FiEdit className="h-5 w-5 text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <span className="font-medium text-gray-900">Change Password</span>
            <FiSettings className="h-5 w-5 text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <span className="font-medium text-gray-900">Notification Preferences</span>
            <FiBell className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeEditModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                  <button
                    onClick={closeEditModal}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                        placeholder="John Doe"
                        aria-invalid={errors.name ? 'true' : 'false'}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                        disabled={isEditing}
                      />
                    </div>
                    {errors.name && <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                        placeholder="you@example.com"
                        aria-invalid={errors.email ? 'true' : 'false'}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        disabled={isEditing}
                      />
                    </div>
                    {errors.email && <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                        placeholder="+91 98765 43210"
                        aria-invalid={errors.phone ? 'true' : 'false'}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                        disabled={isEditing}
                      />
                    </div>
                    {errors.phone && <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">{errors.phone}</p>}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                      disabled={isEditing}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isEditing}
                      className={`flex-1 px-4 py-3 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${isEditing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {isEditing ? (
                        <>
                          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SavedPropertiesTab({ savedProperties, isSavedLoading, onUnsave, onBookViewing }) {
  if (isSavedLoading) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (savedProperties.length === 0) {
    return (
      <div className="text-center py-16">
        <FiHeart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved properties yet</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Save properties you like to compare them later and get notified of any updates.
        </p>
        <Link
          to="/search"
          className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <FiSearch className="h-5 w-5" />
          Start Searching
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="list" aria-label="Saved properties">
      {savedProperties.map((saved) => {
        const property = saved.property;
        return (
          <article key={saved.saved_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow group" role="listitem">
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
              <Link to={`/property/${property.property_id}`} className="block w-full h-full">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={getImageUrl(property.images[0])}
                    alt={`${property.title} property image`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <FiHome className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </Link>
              <div className="absolute top-3 right-3">
                <StatusBadge status={property.availability_status} type="availability" size="sm" />
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                <Link to={`/property/${property.property_id}`} className="hover:text-blue-600 transition-colors">
                  {property.title}
                </Link>
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                <FiMapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {property.location}
              </p>

              <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                {property.bedrooms && (
                  <span className="flex items-center gap-1">
                    <FiHome className="h-4 w-4" />
                    {property.bedrooms} Bed
                  </span>
                )}
                {property.bathrooms && (
                  <span className="flex items-center gap-1">
                    <FiMaximize2 className="h-4 w-4" />
                    {property.bathrooms} Bath
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-xl font-bold text-gray-900">₹{Number(property.price).toLocaleString()}/mo</p>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/property/${property.property_id}`}
                    className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
                  >
                    <FiEye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                  <button
                    onClick={() => onBookViewing(property)}
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiCalendar className="h-4 w-4 mr-1" />
                    Book
                  </button>
                  <button
                    onClick={() => onUnsave(saved)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label={`Remove ${property.title} from saved`}
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default UserDashboard;