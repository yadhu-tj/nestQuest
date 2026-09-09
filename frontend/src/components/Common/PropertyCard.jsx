import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiMapPin, FiDollarSign, FiMaximize2, FiTag } from 'react-icons/fi';
import { getImageUrl } from '../../services/api';

export default function PropertyCard({ property }) {
  const { property_id, title, location, price, availability_status, images, bedrooms, bathrooms, area_sqft, property_type } = property;

  const primaryImage = images && images.length > 0 
    ? getImageUrl(images[0])
    : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"%3E%3Crect fill="%23e5e7eb" width="400" height="250"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="16" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';

  const isAvailable = availability_status === 'Available';
  const availabilityClass = isAvailable 
    ? 'bg-green-100 text-green-800' 
    : 'bg-gray-100 text-gray-800';

  return (
    <article className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Link to={`/property/${property_id}`} className="block w-full h-full" aria-label={`View details for ${title}`}>
          <img
            src={primaryImage}
            alt={`${title} property image`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </Link>
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${availabilityClass}`}>
            {availability_status}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 flex-1 min-w-0">
            <Link to={`/property/${property_id}`} className="hover:text-blue-600 transition-colors">
              {title}
            </Link>
          </h3>
          <div className="text-right flex-shrink-0">
            <p className="text-xl font-bold text-gray-900">${Number(price).toLocaleString()}</p>
            <p className="text-xs text-gray-500">per month</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <FiMapPin className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {location}
          </span>
          {property_type && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
              <FiTag className="h-3 w-3" aria-hidden="true" />
              {property_type}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-3">
          {bedrooms && (
            <span className="flex items-center gap-1">
              <FiHome className="h-4 w-4" aria-hidden="true" />
              {bedrooms} Bed
            </span>
          )}
          {bathrooms && (
            <span className="flex items-center gap-1">
              <FiMaximize2 className="h-4 w-4" aria-hidden="true" />
              {bathrooms} Bath
            </span>
          )}
          {area_sqft && (
            <span className="flex items-center gap-1">
              <FiDollarSign className="h-4 w-4" aria-hidden="true" />
              {area_sqft.toLocaleString()} sqft
            </span>
          )}
        </div>

        <Link
          to={`/property/${property_id}`}
          className="mt-4 block w-full text-center py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}