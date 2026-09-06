import React from 'react';

const bookingStatusConfig = {
  Pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800',
    dotClassName: 'bg-yellow-500',
  },
  Confirmed: {
    label: 'Confirmed',
    className: 'bg-green-100 text-green-800',
    dotClassName: 'bg-green-500',
  },
  Completed: {
    label: 'Completed',
    className: 'bg-blue-100 text-blue-800',
    dotClassName: 'bg-blue-500',
  },
  Cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800',
    dotClassName: 'bg-red-500',
  },
};

const availabilityStatusConfig = {
  Available: {
    label: 'Available',
    className: 'bg-green-100 text-green-800',
    dotClassName: 'bg-green-500',
  },
  Unavailable: {
    label: 'Unavailable',
    className: 'bg-gray-100 text-gray-800',
    dotClassName: 'bg-gray-500',
  },
  Rented: {
    label: 'Rented',
    className: 'bg-blue-100 text-blue-800',
    dotClassName: 'bg-blue-500',
  },
  Sold: {
    label: 'Sold',
    className: 'bg-purple-100 text-purple-800',
    dotClassName: 'bg-purple-500',
  },
};

export default function StatusBadge({ status, type = 'booking', size = 'md', showDot = true, className = '' }) {
  const config = type === 'availability' ? availabilityStatusConfig : bookingStatusConfig;
  const statusConfig = config[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800',
    dotClassName: 'bg-gray-500',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const dotSizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${statusConfig.className} ${className}`}
      aria-label={`${type} status: ${statusConfig.label}`}
    >
      {showDot && (
        <span className={`${dotSizeClasses[size]} rounded-full ${statusConfig.dotClassName}`} aria-hidden="true" />
      )}
      {statusConfig.label}
    </span>
  );
}

export function BookingStatusBadge({ status, ...props }) {
  return <StatusBadge status={status} type="booking" {...props} />;
}

export function AvailabilityStatusBadge({ status, ...props }) {
  return <StatusBadge status={status} type="availability" {...props} />;
}