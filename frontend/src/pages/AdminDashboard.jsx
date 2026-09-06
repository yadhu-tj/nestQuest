import React, { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiBriefcase, FiHome, FiCalendar, FiTrash2, FiEye, FiLoader, FiBarChart2, FiAlertCircle, FiCheckCircle, FiXCircle, FiUser, FiShield, FiLogOut, FiMapPin, FiMaximize2, FiX, FiMail, FiPhone, FiEdit } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import StatusBadge from '../components/Common/StatusBadge';
import { ConfirmModal } from '../components/Common/Modal';
import api, { getImageUrl } from '../services/api';

export default function AdminDashboard() {
  const { isAuthenticated, role, loading: authLoading, user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [brokers, setBrokers] = useState([]);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteBrokerConfirm, setShowDeleteBrokerConfirm] = useState(false);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
  const [showDeletePropertyConfirm, setShowDeletePropertyConfirm] = useState(false);
  const [showEditBrokerModal, setShowEditBrokerModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [brokerToDelete, setBrokerToDelete] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [brokerToEdit, setBrokerToEdit] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [statsRes, brokersRes, usersRes, propertiesRes] = await Promise.all([
        api.get('/admin/reports'),
        api.get('/admin/brokers'),
        api.get('/admin/users'),
        api.get('/admin/properties'),
      ]);
      setStats(statsRes.data.data);
      setBrokers(brokersRes.data.data || []);
      setUsers(usersRes.data.data || []);
      setProperties(propertiesRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && role === 'admin') {
      fetchAllData();
    }
  }, [isAuthenticated, role, fetchAllData]);

  const handleDeleteBroker = async () => {
    if (!brokerToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/brokers/${brokerToDelete.broker_id}`);
      setBrokers(prev => prev.filter(b => b.broker_id !== brokerToDelete.broker_id));
      if (stats) {
        setStats(prev => ({ ...prev, total_brokers: prev.total_brokers - 1 }));
      }
      setShowDeleteBrokerConfirm(false);
      setBrokerToDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete broker');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/users/${userToDelete.user_id}`);
      setUsers(prev => prev.filter(u => u.user_id !== userToDelete.user_id));
      if (stats) {
        setStats(prev => ({ ...prev, total_users: prev.total_users - 1 }));
      }
      setShowDeleteUserConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/properties/${propertyToDelete.property_id}`);
      setProperties(prev => prev.filter(p => p.property_id !== propertyToDelete.property_id));
      if (stats) {
        setStats(prev => ({ ...prev, total_properties: prev.total_properties - 1 }));
      }
      setShowDeletePropertyConfirm(false);
      setPropertyToDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete property');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeletePropertyClick = (property) => {
    setPropertyToDelete(property);
    setShowDeletePropertyConfirm(true);
  };

  const handleDeleteBrokerClick = (broker) => {
    setBrokerToDelete(broker);
    setShowDeleteBrokerConfirm(true);
  };

  const handleDeleteUserClick = (user) => {
    setUserToDelete(user);
    setShowDeleteUserConfirm(true);
  };

  const handleEditBroker = (broker) => {
    setBrokerToEdit(broker);
    setShowEditBrokerModal(true);
  };

  const handleCloseEditBrokerModal = () => {
    setShowEditBrokerModal(false);
  };

  const handleEditUser = (user) => {
    setUserToEdit(user);
    setShowEditUserModal(true);
  };

  const handleCloseEditUserModal = () => {
    setShowEditUserModal(false);
  };

  const handleEditBrokerSubmit = async (broker) => {
    if (!broker) return;
    setIsEditing(true);
    try {
      await api.put(`/admin/brokers/${broker.broker_id}`, {
        broker_name: document.getElementById('broker_name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        company_name: document.getElementById('company_name').value || null
      });
      setShowEditBrokerModal(false);
      fetchAllData();
      alert('Broker updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update broker');
    } finally {
      setIsEditing(false);
    }
  };

  const handleEditUserSubmit = async (user) => {
    if (!user) return;
    setIsEditing(true);
    try {
      await api.put(`/admin/users/${user.user_id}`, {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
      });
      setShowEditUserModal(false);
      fetchAllData();
      alert('User updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    } finally {
      setIsEditing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" ariaLabel="Loading dashboard" />
      </div>
    );
  }

  if (!isAuthenticated || role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <FiShield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
          <p className="text-gray-600 mb-6">You need to be logged in as an admin to view this dashboard.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <FiLogOut className="h-5 w-5" />
            Log In as Admin
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
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome, {user?.name || 'Admin'}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FiLogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 xl:col-span-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiBarChart2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_properties || 0}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats?.available_properties || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <FiAlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_bookings || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <FiAlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pending_bookings || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <FiUsers className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_users || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiBriefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Brokers</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_brokers || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px flex-wrap" aria-label="Admin dashboard tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiBarChart2 className="h-5 w-5 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('brokers')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'brokers'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiBriefcase className="h-5 w-5 inline mr-2" />
                Brokers ({brokers.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiUsers className="h-5 w-5 inline mr-2" />
                Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('properties')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'properties'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiHome className="h-5 w-5 inline mr-2" />
                All Properties ({properties.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab stats={stats} setActiveTab={setActiveTab} />
            )}

            {activeTab === 'brokers' && (
              <BrokersTab
                brokers={brokers}
                isLoading={isLoading}
                error={error}
                onDelete={handleDeleteBrokerClick}
                onEdit={handleEditBroker}
              />
            )}

            {activeTab === 'users' && (
              <UsersTab
                users={users}
                isLoading={isLoading}
                error={error}
                onDelete={handleDeleteUserClick}
                onEdit={handleEditUser}
              />
            )}

            {activeTab === 'properties' && (
              <PropertiesTab
                properties={properties}
                isLoading={isLoading}
                error={error}
                formatDate={formatDate}
                onDelete={handleDeletePropertyClick}
              />
            )}
          </div>
        </div>
      </main>

      {/* Delete Broker Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteBrokerConfirm}
        onClose={() => {
          setShowDeleteBrokerConfirm(false);
          setBrokerToDelete(null);
        }}
        onConfirm={handleDeleteBroker}
        title="Delete Broker"
        message={
          brokerToDelete ? (
            <>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete broker <strong>{brokerToDelete.broker_name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Email: {brokerToDelete.email}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Company: {brokerToDelete.company_name || 'N/A'}
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. All properties and bookings associated with this broker will also be permanently deleted.
              </div>
            </>
          ) : (
            <p className="text-gray-600">Please select a broker to delete.</p>
          )
        }
        confirmText="Delete Broker"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteUserConfirm}
        onClose={() => {
          setShowDeleteUserConfirm(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={
          userToDelete ? (
            <>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete user <strong>{userToDelete.user_name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Email: {userToDelete.email}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Bookings: {userToDelete.booking_count}
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. All bookings associated with this user will also be permanently deleted.
              </div>
            </>
          ) : (
            <p className="text-gray-600">Please select a user to delete.</p>
          )
        }
        confirmText="Delete User"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
      
      {/* Delete Property Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeletePropertyConfirm}
        onClose={() => {
          setShowDeletePropertyConfirm(false);
          setPropertyToDelete(null);
        }}
        onConfirm={handleDeleteProperty}
        title="Delete Property"
        message={
          propertyToDelete ? (
            <>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete property <strong>{propertyToDelete.title}</strong>?
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Location: {propertyToDelete.location}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Broker: {propertyToDelete.broker_name || 'Unknown'} {propertyToDelete.broker_company ? `(${propertyToDelete.broker_company})` : ''}
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. All images and bookings associated with this property will also be permanently deleted.
              </div>
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
      {/* Edit Broker Modal */}
      {showEditBrokerModal && brokerToEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseEditBrokerModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Edit Broker</h2>
                  <button
                    onClick={handleCloseEditBrokerModal}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleEditBrokerSubmit(brokerToEdit); }} className="space-y-4">
                  <div>
                    <label htmlFor="broker_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <input
                        type="text"
                        id="broker_name"
                        name="broker_name"
                        defaultValue={brokerToEdit?.broker_name || ''}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        defaultValue={brokerToEdit?.email || ''}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        defaultValue={brokerToEdit?.phone || ''}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <div className="relative">
                      <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <input
                        type="text"
                        id="company_name"
                        name="company_name"
                        defaultValue={brokerToEdit?.company_name || ''}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseEditBrokerModal}
                      className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && userToEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseEditUserModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                  <button
                    onClick={handleCloseEditUserModal}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleEditUserSubmit(userToEdit); }} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        defaultValue={userToEdit?.user_name || ''}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        defaultValue={userToEdit?.email || ''}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        defaultValue={userToEdit?.phone || ''}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseEditUserModal}
                      className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Save Changes
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

function OverviewTab({ stats, setActiveTab }) {
  if (!stats) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard icon={<FiHome className="h-6 w-6" />} label="Total Properties" value={stats.total_properties} color="blue" />
          <StatCard icon={<FiCheckCircle className="h-6 w-6" />} label="Available Properties" value={stats.available_properties} color="green" />
          <StatCard icon={<FiCalendar className="h-6 w-6" />} label="Total Bookings" value={stats.total_bookings} color="yellow" />
          <StatCard icon={<FiAlertCircle className="h-6 w-6" />} label="Pending Bookings" value={stats.pending_bookings} color="orange" />
          <StatCard icon={<FiUsers className="h-6 w-6" />} label="Total Users" value={stats.total_users} color="purple" />
          <StatCard icon={<FiBriefcase className="h-6 w-6" />} label="Total Brokers" value={stats.total_brokers} color="blue" />
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('brokers')}
            className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-center"
          >
            <FiUsers className="h-10 w-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Manage Brokers</h3>
            <p className="text-sm text-gray-500 mt-1">View, edit, or remove brokers</p>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-center"
          >
            <FiUsers className="h-10 w-10 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-500 mt-1">View, edit, or remove users</p>
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-center"
          >
            <FiHome className="h-10 w-10 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">View All Properties</h3>
            <p className="text-sm text-gray-500 mt-1">Browse all property listings</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    blue2: 'bg-blue-100 text-blue-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.blue}`}>
          {icon}
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function BrokersTab({ brokers, isLoading, error, onDelete, onEdit }) {
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
        <div className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load brokers</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  if (brokers.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No brokers registered</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          No brokers have registered on the platform yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" role="table">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Broker</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Properties</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {brokers.map((broker) => (
            <tr key={broker.broker_id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4">
                <div>
                  <p className="font-medium text-gray-900">{broker.broker_name}</p>
                  <p className="text-sm text-gray-500">ID: {broker.broker_id}</p>
                </div>
              </td>
              <td className="px-4 py-4">
                <p className="text-sm text-gray-600">{broker.email}</p>
                <p className="text-sm text-gray-500">{broker.phone}</p>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                {broker.company_name || '—'}
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                {broker.property_count || 0}
              </td>
              <td className="px-4 py-4 text-sm text-gray-500">
                {broker.created_at ? new Date(broker.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(broker)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    aria-label={`Edit broker ${broker.broker_name}`}
                  >
                    <FiEdit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDelete(broker)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label={`Delete broker ${broker.broker_name}`}
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersTab({ users, isLoading, error, onDelete, onEdit }) {
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
        <div className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load users</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No users registered</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          No users have registered on the platform yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" role="table">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bookings</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => (
            <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4">
                <div>
                  <p className="font-medium text-gray-900">{user.user_name}</p>
                  <p className="text-sm text-gray-500">ID: {user.user_id}</p>
                </div>
              </td>
              <td className="px-4 py-4">
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500">{user.phone}</p>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                {user.booking_count || 0}
              </td>
              <td className="px-4 py-4 text-sm text-gray-500">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    aria-label={`Edit user ${user.user_name}`}
                  >
                    <FiEdit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDelete(user)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label={`Delete user ${user.user_name}`}
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PropertiesTab({ properties, isLoading, error, formatDate, onDelete }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-live="polite">
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
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load properties</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">No properties have been listed on the platform yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="list" aria-label="All properties">
      {properties.map((property) => (
        <article key={property.property_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow" role="listitem">
          <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
            {property.images && property.images.length > 0 ? (
              <img
                src={getImageUrl(property.images[0])}
                alt={`${property.title} property image`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <FiHome className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <StatusBadge status={property.availability_status} type="availability" size="sm" />
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{property.title}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
              <FiMapPin className="h-3.5 w-3.5" />
              {property.location}
            </p>
            <p className="text-sm text-gray-500 mb-3">
              Broker: {property.broker_name || 'Unknown'} {property.broker_company ? `(${property.broker_company})` : ''}
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
              <StatusBadge status={property.availability_status} type="availability" size="sm" />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => onDelete(property)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label={`Delete property ${property.title}`}
              >
                <FiTrash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}