import React, { useState, useEffect, useCallback } from 'react';
import { FiCalendar, FiUser, FiHome, FiAlertCircle, FiCheckCircle, FiXCircle, FiLoader, FiEye } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import StatusBadge from '../Common/StatusBadge';
import { ConfirmModal } from '../Common/Modal';

const STATUS_ACTIONS = {
  Pending: [
    { label: 'Confirm', newStatus: 'Confirmed', variant: 'success', icon: FiCheckCircle },
    { label: 'Cancel', newStatus: 'Cancelled', variant: 'danger', icon: FiXCircle },
  ],
  Confirmed: [
    { label: 'Complete', newStatus: 'Completed', variant: 'primary', icon: FiCheckCircle },
    { label: 'Cancel', newStatus: 'Cancelled', variant: 'danger', icon: FiXCircle },
  ],
  Completed: [],
  Cancelled: [],
};

const statusOrder = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'booking_date', direction: 'desc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewBookingDetails, setViewBookingDetails] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/bookings/');
      setBookings(response.data.data || []);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load bookings. Please try again.';
      setError(message);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedBookings = React.useMemo(() => {
    let result = [...bookings];

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter((b) => b.status === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [bookings, filterStatus, sortConfig]);

  const handleStatusAction = async (booking, action) => {
    if (action.newStatus === 'view') {
      setIsFetchingDetails(true);
      try {
        const response = await api.get(`/bookings/${booking.booking_id}`);
        setViewBookingDetails(response.data.data);
        setShowViewModal(true);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to fetch booking details');
      } finally {
        setIsFetchingDetails(false);
      }
      return;
    }
    setSelectedBooking(booking);
    setPendingAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedBooking || !pendingAction) return;

    setIsUpdating(true);
    try {
      await api.patch(`/bookings/${selectedBooking.booking_id}/status`, {
        status: pendingAction.newStatus,
      });
      // Refresh bookings after successful update
      fetchBookings();
      setShowStatusModal(false);
      setSelectedBooking(null);
      setPendingAction(null);
    } catch (err) {
      const message = err.response?.data?.message || `Failed to ${pendingAction.label.toLowerCase()} booking.`;
      alert(message); // Could use toast here
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusActions = (status) => STATUS_ACTIONS[status] || [];

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" ariaLabel="Loading bookings" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-gray-900">Unable to load bookings</h3>
        <p className="mt-2 text-gray-600">{error}</p>
        <button
          onClick={fetchBookings}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const pendingCount = bookings.filter((b) => b.status === 'Pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'Confirmed').length;

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Incoming Bookings</h2>
          <p className="mt-1 text-gray-600">Manage visit requests for your properties</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 rounded-full">
            {pendingCount} Pending
          </span>
          <span className="px-3 py-1 text-sm font-medium bg-green-50 text-green-700 rounded-full">
            {confirmedCount} Confirmed
          </span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {sortedBookings.length === 0 ? (
          <div className="py-12 text-center">
            <FiCalendar className="h-12 w-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-medium text-gray-900">
              {filterStatus !== 'all' ? `No ${filterStatus.toLowerCase()} bookings` : 'No bookings yet'}
            </h3>
            <p className="mt-2 text-gray-500">
              {filterStatus !== 'all'
                ? 'Try changing the filter or check back later.'
                : 'When users book visits for your properties, they will appear here.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('property_title')}
                    >
                      <div className="flex items-center gap-1">
                        Property
                        <FiHome className="h-4 w-4" aria-hidden="true" />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('user_name')}
                    >
                      <div className="flex items-center gap-1">
                        User
                        <FiUser className="h-4 w-4" aria-hidden="true" />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('booking_date')}
                    >
                      <div className="flex items-center gap-1">
                        Booked On
                        <FiCalendar className="h-4 w-4" aria-hidden="true" />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('visit_date')}
                    >
                      <div className="flex items-center gap-1">
                        Visit Date
                        <FiCalendar className="h-4 w-4" aria-hidden="true" />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('status')}
                    >
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedBookings.map((booking) => (
                    <tr key={booking.booking_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{booking.property_title || 'Unknown Property'}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <FiHome className="h-3.5 w-3.5" aria-hidden="true" />
                            {booking.property_location || 'Unknown location'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{booking.user_name || 'Unknown User'}</p>
                          <p className="text-sm text-gray-500">ID: {booking.user_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatDateTime(booking.booking_date)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(booking.visit_date)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={booking.status} type="booking" size="md" />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStatusAction(booking, { label: 'View', newStatus: 'view' })}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            aria-label={`View booking ${booking.booking_id} details`}
                          >
                            <FiEye className="h-5 w-5" aria-hidden="true" />
                          </button>
                          {getStatusActions(booking.status).map((action) => (
                            <button
                              key={action.newStatus}
                              onClick={() => handleStatusAction(booking, action)}
                              disabled={isUpdating}
                              className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                action.variant === 'success'
                                  ? 'text-green-600 hover:bg-green-50 focus:ring-green-500'
                                  : action.variant === 'danger'
                                  ? 'text-red-600 hover:bg-red-50 focus:ring-red-500'
                                  : 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
                              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                              aria-label={`${action.label} booking ${booking.booking_id}`}
                            >
                              <action.icon className="h-5 w-5" aria-hidden="true" />
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden">
              {sortedBookings.map((booking) => (
                <div key={booking.booking_id} className="border-t border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{booking.property_title}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <FiHome className="h-3.5 w-3.5" aria-hidden="true" />
                        {booking.property_location}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} type="booking" size="sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-500">User</p>
                      <p className="font-medium text-gray-900">{booking.user_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Booked</p>
                      <p className="font-medium text-gray-900">{formatDateTime(booking.booking_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Visit Date</p>
                      <p className="font-medium text-gray-900">{formatDate(booking.visit_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">User ID</p>
                      <p className="font-medium text-gray-900">{booking.user_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleStatusAction(booking, { label: 'View', newStatus: 'view' })}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      aria-label={`View booking ${booking.booking_id} details`}
                    >
                      <FiEye className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {getStatusActions(booking.status).map((action) => (
                      <button
                        key={action.newStatus}
                        onClick={() => handleStatusAction(booking, action)}
                        disabled={isUpdating}
                        className={`p-2 rounded-lg transition-colors ${
                          action.variant === 'success'
                            ? 'text-green-600 hover:bg-green-50'
                            : action.variant === 'danger'
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-blue-600 hover:bg-blue-50'
                        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label={`${action.label} booking ${booking.booking_id}`}
                      >
                        <action.icon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Status Update Confirmation Modal */}
      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedBooking(null);
          setPendingAction(null);
        }}
        onConfirm={confirmStatusUpdate}
        title={`${pendingAction?.label || 'Update'} Booking`}
        message={
          selectedBooking ? (
            <>
              <p className="text-gray-600 mb-2">
                Are you sure you want to <strong>{pendingAction?.label.toLowerCase()}</strong> this booking?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p><strong>Property:</strong> {selectedBooking.property_title}</p>
                <p><strong>User:</strong> {selectedBooking.user_name}</p>
                <p><strong>Visit Date:</strong> {formatDate(selectedBooking.visit_date)}</p>
                <p><strong>Current Status:</strong>{' '}
                  <StatusBadge status={selectedBooking.status} type="booking" size="sm" showDot={false} />
                </p>
                <p><strong>New Status:</strong> {pendingAction?.newStatus}</p>
              </div>
            </>
          ) : (
            <p className="text-gray-600">Please select a booking.</p>
          )
        }
        confirmText={pendingAction?.label || 'Confirm'}
        cancelText="Cancel"
        variant={
          pendingAction?.variant === 'success' ? 'success' :
          pendingAction?.variant === 'danger' ? 'danger' :
          'primary'
        }
        isLoading={isUpdating}
      />

      {/* View Booking Details Modal */}
      {showViewModal && viewBookingDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowViewModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Booking Details</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p><strong>Booking ID:</strong> #{viewBookingDetails.booking_id}</p>
                <p><strong>Property:</strong> {viewBookingDetails.property_title}</p>
                <p><strong>Location:</strong> {viewBookingDetails.property_location}</p>
                <p><strong>Price:</strong> ₹{viewBookingDetails.property_price ? Number(viewBookingDetails.property_price).toLocaleString() : '—'}/mo</p>
                <p><strong>User Name:</strong> {viewBookingDetails.user_name}</p>
                <p><strong>User Email:</strong> {viewBookingDetails.user_email || '—'}</p>
                <p><strong>User Phone:</strong> {viewBookingDetails.user_phone || '—'}</p>
                <p><strong>Visit Date:</strong> {formatDate(viewBookingDetails.visit_date)}</p>
                <p><strong>Booked On:</strong> {formatDateTime(viewBookingDetails.booking_date)}</p>
                <div className="flex items-center gap-2">
                  <strong>Status:</strong>
                  <StatusBadge status={viewBookingDetails.status} type="booking" size="sm" />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}