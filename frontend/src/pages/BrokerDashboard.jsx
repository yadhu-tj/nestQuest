import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiHome, FiBriefcase, FiCalendar, FiAlertCircle, FiCheckCircle, FiXCircle, FiArrowLeft, FiSearch, FiImage, FiLogOut, FiMapPin, FiMaximize2, FiUser, FiFilter, FiLogIn, FiSettings, FiBell, FiMail, FiPhone, FiHelpCircle } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import StatusBadge from '../components/Common/StatusBadge';
import { ConfirmModal } from '../components/Common/Modal';
import PropertyForm from '../components/Broker/PropertyForm';
import BookingList from '../components/Broker/BookingList';
import api, { getImageUrl } from '../services/api';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Properties' },
  { value: 'Available', label: 'Available' },
  { value: 'Unavailable', label: 'Unavailable' },
  { value: 'Rented', label: 'Rented' },
];

export default function BrokerDashboard() {
  const { isAuthenticated, role, loading: authLoading, user, logout } = useAuth();
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('properties');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('availability_status', statusFilter);
      }
      const response = await api.get(`/properties/?${params.toString()}`);
      setProperties(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load properties');
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isAuthenticated && role === 'broker') {
      fetchProperties();
    }
  }, [isAuthenticated, role, fetchProperties]);

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;

    setIsDeleting(true);
    try {
      await api.delete(`/properties/${propertyToDelete.property_id}`);
      setProperties((prev) => prev.filter((p) => p.property_id !== propertyToDelete.property_id));
      setShowDeleteConfirm(false);
      setPropertyToDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete property');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePropertySaved = () => {
    setShowAddForm(false);
    setEditingProperty(null);
    fetchProperties();
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setShowAddForm(true);
  };

  const handleDeleteClick = (property) => {
    setPropertyToDelete(property);
    setShowDeleteConfirm(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredProperties = properties;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" ariaLabel="Loading dashboard" />
      </div>
    );
  }

  if (!isAuthenticated || role !== 'broker') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <FiBriefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Broker Access Required</h1>
          <p className="text-gray-600 mb-6">You need to be logged in as a broker to view this dashboard.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <FiLogIn className="h-5 w-5" />
            Log In as Broker
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Broker Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome, {user?.name || 'Broker'}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setEditingProperty(null);
                  setShowAddForm(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus className="h-5 w-5" />
                Add Property
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiHome className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <FiCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Available</p>
                <p className="text-2xl font-bold text-gray-900">
                  {properties.filter((p) => p.availability_status === 'Available').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <FiAlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Unavailable</p>
                <p className="text-2xl font-bold text-gray-900">
                  {properties.filter((p) => p.availability_status === 'Unavailable').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiBriefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Rented</p>
                <p className="text-2xl font-bold text-gray-900">
                  {properties.filter((p) => p.availability_status === 'Rented').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" aria-label="Dashboard tabs">
              <button
                onClick={() => setActiveTab('properties')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'properties'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiHome className="h-5 w-5 inline mr-2" />
                My Properties
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'bookings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiCalendar className="h-5 w-5 inline mr-2" />
                Incoming Bookings
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
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'properties' && (
              <PropertiesTab
                properties={filteredProperties}
                isLoading={isLoading}
                error={error}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                onAdd={() => {
                  setEditingProperty(null);
                  setShowAddForm(true);
                }}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onRefresh={fetchProperties}
                formatDate={formatDate}
                navigate={navigate}
              />
            )}

            {activeTab === 'bookings' && (
              <BookingListTab onRefresh={fetchProperties} />
            )}

            {activeTab === 'profile' && (
              <BrokerProfileTab user={user} onLogout={logout} />
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Property Modal */}
      {(showAddForm || editingProperty) && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
            setShowAddForm(false);
            setEditingProperty(null);
          }} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                <PropertyForm
                  initialData={editingProperty}
                  onClose={() => {
                    setShowAddForm(false);
                    setEditingProperty(null);
                  }}
                  onSuccess={handlePropertySaved}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPropertyToDelete(null);
        }}
        onConfirm={handleDeleteProperty}
        title="Delete Property"
        message={
          propertyToDelete ? (
            <>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <strong>{propertyToDelete.title}</strong>?
              </p>
              <p className="text-sm text-gray-500">
                This action cannot be undone. All associated images and pending bookings will also be removed.
              </p>
            </>
          ) : (
            <p className="text-gray-600">Please select a property to delete.</p>
          )
        }
        confirmText="Delete Property"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function PropertiesTab({
  properties,
  isLoading,
  error,
  statusFilter,
  setStatusFilter,
  onAdd,
  onEdit,
  onDelete,
  onRefresh,
  formatDate,
  navigate,
}) {
  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg" />
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load properties</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={onRefresh} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-16">
        <FiHome className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {statusFilter !== 'all' ? `No ${statusFilter.toLowerCase()} properties` : 'No properties yet'}
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {statusFilter !== 'all'
            ? `Try changing the filter to see more properties.`
            : 'Get started by adding your first property listing.'}
        </p>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="h-5 w-5" />
          {statusFilter !== 'all' ? 'Clear Filter' : 'Add Your First Property'}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FiFilter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            aria-label="Filter by status"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-500">
          Showing {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="list" aria-label="Your properties">
        {properties.map((property) => (
          <article key={property.property_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow group" role="listitem">
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
                    <FiImage className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </Link>
              <div className="absolute top-3 right-3">
                <StatusBadge status={property.availability_status} type="availability" size="sm" />
              </div>
              <div className="absolute bottom-3 right-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="p-2 bg-white/90 backdrop-blur rounded-full text-gray-500 hover:text-blue-600 hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Edit ${property.title}`}
                  onClick={() => onEdit(property)}
                >
                  <FiEdit className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                <Link to={`/property/${property.property_id}`} className="hover:text-blue-600 transition-colors">
                  {property.title}
                </Link>
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                <FiMapPin className="h-3.5 w-3.5" />
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/property/${property.property_id}`);
                    }}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    aria-label={`View ${property.title}`}
                  >
                    <FiEye className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(property);
                    }}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label={`Delete ${property.title}`}
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function BookingListTab({ onRefresh }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Incoming Bookings</h2>
      </div>
      <BookingList />
    </div>
  );
}

function BrokerProfileTab({ user, onLogout }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    broker_name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company_name: user?.company_name || ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!formData.broker_name.trim()) errors.broker_name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Please enter a valid email address';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    else if (formData.phone.length < 7 || formData.phone.length > 15) errors.phone = 'Phone number must be between 7 and 15 digits';
    else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) errors.phone = 'Please enter a valid phone number';
    return errors;
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
      await api.put('/auth/profile', { 
        broker_name: formData.broker_name.trim(), 
        email: formData.email.trim(), 
        phone: formData.phone.trim(),
        company_name: formData.company_name?.trim() || null
      });
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const openEditModal = () => {
    setFormData({ 
      broker_name: user?.name || '', 
      email: user?.email || '', 
      phone: user?.phone || '',
      company_name: user?.company_name || ''
    });
    setErrors({});
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setErrors({});
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
    });
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
              <p className="text-lg font-semibold text-gray-900">{user?.name || 'Broker'}</p>
              <p className="text-gray-500">{user?.email || 'broker@example.com'}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                {user?.company_name ? 'Company: ' + user.company_name : 'Independent Broker'}
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
              <p className="text-sm text-gray-500">Company</p>
              <p className="font-medium text-gray-900">{user?.company_name || '—'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium text-gray-900">{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '—'}</p>
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
                    <label htmlFor="broker_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <input
                        type="text"
                        id="broker_name"
                        name="broker_name"
                        value={formData.broker_name}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${errors.broker_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                        placeholder="John Doe"
                        aria-invalid={errors.broker_name ? 'true' : 'false'}
                        aria-describedby={errors.broker_name ? 'broker_name-error' : undefined}
                        disabled={isEditing}
                      />
                    </div>
                    {errors.broker_name && <p id="broker_name-error" className="mt-1 text-sm text-red-600" role="alert">{errors.broker_name}</p>}
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

                  <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Company Name
                      <FiHelpCircle className="h-4 w-4 text-gray-400" aria-label="Your real estate company or agency name" />
                    </label>
                    <div className="relative">
                      <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <input
                        type="text"
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${errors.company_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                        placeholder="E.g. Skyline Realty"
                        disabled={isEditing}
                      />
                    </div>
                    {errors.company_name && <p id="company_name-error" className="mt-1 text-sm text-red-600" role="alert">{errors.company_name}</p>}
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