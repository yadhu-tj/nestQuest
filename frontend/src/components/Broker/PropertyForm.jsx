import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiImage, FiX, FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import StatusBadge from '../Common/StatusBadge';
import { ConfirmModal } from '../Common/Modal';

const PROPERTY_TYPES = [
  'Apartment',
  'House',
  'Villa',
  'Condo',
  'Townhouse',
  'Studio',
  'Duplex',
  'Penthouse',
  'Land',
  'Commercial',
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const initialFormData = {
  title: '',
  description: '',
  broker_notes: '',
  property_type: '',
  price: '',
  location: '',
  bedrooms: '',
  bathrooms: '',
  area_sqft: '',
  availability_status: 'Available',
};

const initialErrors = {
  title: '',
  property_type: '',
  price: '',
  location: '',
  images: '',
};

export default function PropertyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState(initialErrors);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [existingImages, setExistingImages] = useState([]);

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'title':
        if (!value.trim()) return 'Title is required';
        if (value.length > 150) return 'Title must be 150 characters or less';
        return '';
      case 'property_type':
        if (!value) return 'Property type is required';
        return '';
      case 'price':
        if (!value) return 'Price is required';
        const numPrice = parseFloat(value);
        if (isNaN(numPrice) || numPrice <= 0) return 'Price must be a positive number';
        return '';
      case 'location':
        if (!value.trim()) return 'Location is required';
        if (value.length > 150) return 'Location must be 150 characters or less';
        return '';
      case 'bedrooms':
        if (value && (parseInt(value) < 0 || parseInt(value) > 20)) return 'Bedrooms must be between 0 and 20';
        return '';
      case 'bathrooms':
        if (value && (parseInt(value) < 0 || parseInt(value) > 20)) return 'Bathrooms must be between 0 and 20';
        return '';
      case 'area_sqft':
        if (value && (parseInt(value) < 0 || parseInt(value) > 100000)) return 'Area must be between 0 and 100,000 sqft';
        return '';
      default:
        return '';
    }
  }, []);

  const validateImages = useCallback((fileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return '';
    
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return `Invalid file type: ${file.name}. Allowed: jpg, jpeg, png, webp`;
      }
      if (file.size > MAX_FILE_SIZE) {
        return `File too large: ${file.name}. Max size: 5MB`;
      }
    }
    return '';
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const error = validateImages(files);
    setErrors((prev) => ({ ...prev, images: error }));
    
    if (!error) {
      const newImages = [...images, ...files];
      setImages(newImages);
      
      const newPreviews = [...imagePreviews];
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          setImagePreviews([...newPreviews]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageUrl) => {
    try {
      await api.delete(`/properties/${id}/images/${encodeURIComponent(imageUrl)}`);
      setExistingImages((prev) => prev.filter((img) => img !== imageUrl));
    } catch (error) {
      console.error('Failed to delete image:', error);
      setSubmitError('Failed to delete image. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    // Validate required fields
    const newErrors = {};
    Object.keys(initialErrors).forEach((key) => {
      if (key !== 'images') {
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
    });

    // Validate images for new property
    if (!isEditing && images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const propertyData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        broker_notes: formData.broker_notes.trim() || null,
        property_type: formData.property_type,
        price: parseFloat(formData.price),
        location: formData.location.trim(),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        area_sqft: formData.area_sqft ? parseInt(formData.area_sqft) : null,
      };

      // availability_status is only accepted on UPDATE, not CREATE
      if (isEditing) {
        propertyData.availability_status = formData.availability_status;
      }

      let propertyId = id;

      if (isEditing) {
        await api.put(`/properties/${id}`, propertyData);
      } else {
        const response = await api.post('/properties', propertyData);
        propertyId = response.data.data.property_id;
      }

      // Upload images if any
      if (images.length > 0 && propertyId) {
        const formDataUpload = new FormData();
        images.forEach((file) => {
          formDataUpload.append('images', file);
        });
        await api.post(`/properties/${propertyId}/images`, formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate('/broker');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save property. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/properties/${id}`);
      navigate('/broker');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete property.';
      setSubmitError(message);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // Load existing property data when editing
  useEffect(() => {
    if (isEditing) {
      setIsLoading(true);
      api.get(`/properties/${id}`)
        .then((response) => {
          const prop = response.data.data;
          setFormData({
            title: prop.title || '',
            description: prop.description || '',
            broker_notes: prop.broker_notes || '',
            property_type: prop.property_type || '',
            price: prop.price ? String(prop.price) : '',
            location: prop.location || '',
            bedrooms: prop.bedrooms ? String(prop.bedrooms) : '',
            bathrooms: prop.bathrooms ? String(prop.bathrooms) : '',
            area_sqft: prop.area_sqft ? String(prop.area_sqft) : '',
            availability_status: prop.availability_status || 'Available',
          });
          setExistingImages(prop.images || []);
        })
        .catch((error) => {
          console.error('Failed to load property:', error);
          setSubmitError('Failed to load property data.');
          navigate('/broker');
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, isEditing, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" ariaLabel="Loading property form" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{isEditing ? 'Edit Property' : 'Add New Property'}</h1>
          <p className="mt-2 text-gray-600">
            {isEditing
              ? 'Update the property details below. Changes to description or broker notes will trigger a re-index for search.'
              : 'Fill in the property details to list it on NestQuest.'}
          </p>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3" role="alert">
            <FiAlertCircle className="flex-shrink-0 mt-0.5 h-5 w-5 text-red-600" aria-hidden="true" />
            <p className="text-sm text-red-800">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm" noValidate>
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <fieldset>
              <legend className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiImage className="h-5 w-5 text-blue-600" aria-hidden="true" />
                Basic Information
              </legend>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      errors.title ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="E.g. Spacious 2BHK near Infopark"
                    aria-invalid={errors.title ? 'true' : 'false'}
                    aria-describedby={errors.title ? 'title-error' : undefined}
                  />
                  {errors.title && (
                    <p id="title-error" className="mt-1 text-sm text-red-600" role="alert">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="property_type"
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      errors.property_type ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    aria-invalid={errors.property_type ? 'true' : 'false'}
                  >
                    <option value="">Select property type</option>
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.property_type && (
                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.property_type}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price (per month) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                        errors.price ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="E.g. 25000"
                      aria-invalid={errors.price ? 'true' : 'false'}
                      aria-describedby={errors.price ? 'price-error' : undefined}
                    />
                  </div>
                  {errors.price && (
                    <p id="price-error" className="mt-1 text-sm text-red-600" role="alert">{errors.price}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      errors.location ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="E.g. Kakkanad, Kochi, Kerala"
                    aria-invalid={errors.location ? 'true' : 'false'}
                    aria-describedby={errors.location ? 'location-error' : undefined}
                  />
                  {errors.location && (
                    <p id="location-error" className="mt-1 text-sm text-red-600" role="alert">{errors.location}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                    <input
                      type="number"
                      id="bedrooms"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      min="0"
                      max="20"
                      className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                        errors.bedrooms ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="2"
                      aria-invalid={errors.bedrooms ? 'true' : 'false'}
                    />
                    {errors.bedrooms && (
                      <p className="mt-1 text-sm text-red-600" role="alert">{errors.bedrooms}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                    <input
                      type="number"
                      id="bathrooms"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      min="0"
                      max="20"
                      className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                        errors.bathrooms ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="2"
                      aria-invalid={errors.bathrooms ? 'true' : 'false'}
                    />
                    {errors.bathrooms && (
                      <p className="mt-1 text-sm text-red-600" role="alert">{errors.bathrooms}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="area_sqft" className="block text-sm font-medium text-gray-700 mb-1">Area (sq ft)</label>
                    <input
                      type="number"
                      id="area_sqft"
                      name="area_sqft"
                      value={formData.area_sqft}
                      onChange={handleChange}
                      min="0"
                      max="100000"
                      className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                        errors.area_sqft ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="1200"
                      aria-invalid={errors.area_sqft ? 'true' : 'false'}
                    />
                    {errors.area_sqft && (
                      <p className="mt-1 text-sm text-red-600" role="alert">{errors.area_sqft}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="availability_status" className="block text-sm font-medium text-gray-700 mb-1">
                    Availability Status
                  </label>
                  <select
                    id="availability_status"
                    name="availability_status"
                    value={formData.availability_status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                    <option value="Rented">Rented</option>
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Description & Broker Notes */}
            <fieldset>
              <legend className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiImage className="h-5 w-5 text-blue-600" aria-hidden="true" />
                Description & Broker Notes
              </legend>
              <div className="space-y-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="Describe the property: amenities, nearby facilities, special features..."
                  />
                </div>

                <div>
                  <label htmlFor="broker_notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Broker Notes (for AI matching)
                    <span className="text-gray-500 font-normal ml-1">(Optional but recommended)</span>
                  </label>
                  <textarea
                    id="broker_notes"
                    name="broker_notes"
                    value={formData.broker_notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="E.g. pet-friendly, quiet area, near IT park, suitable for students, good ventilation, safe locality, family friendly"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    These notes help our AI match this property with relevant user searches. Include lifestyle keywords.
                  </p>
                </div>
              </div>
            </fieldset>

            {/* Images */}
            <fieldset>
              <legend className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiImage className="h-5 w-5 text-blue-600" aria-hidden="true" />
                Property Images
                {!isEditing && <span className="text-sm font-normal text-gray-500">(At least one required)</span>}
              </legend>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <input
                    type="file"
                    id="images"
                    name="images"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    aria-describedby="image-error"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="images"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <FiImage className="h-12 w-12 text-gray-400 mb-3" aria-hidden="true" />
                    <p className="text-gray-600 text-center">
                      <span className="text-blue-600 font-medium underline">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1 text-center">
                      JPG, JPEG, PNG, WebP • Max 5MB each • Multiple files allowed
                    </p>
                  </label>
                </div>

                {errors.images && (
                  <p id="image-error" className="text-sm text-red-600" role="alert">{errors.images}</p>
                )}

                {/* Image Previews */}
                {(imagePreviews.length > 0 || existingImages.length > 0) && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                        <img src={preview} alt={`Upload preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <FiX className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                    {existingImages.map((imgUrl, index) => (
                      <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                        <img src={`http://localhost:5000/static/${imgUrl}`} alt={`Property image ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(imgUrl)}
                          className="absolute top-2 right-2 p-1 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                          aria-label={`Remove existing image ${index + 1}`}
                        >
                          <FiX className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </fieldset>
          </div>

          <div className="px-6 py-5 bg-gray-50 border-t border-gray-200 rounded-b-xl flex flex-col sm:flex-row items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/broker')}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Delete Property
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="h-5 w-5 animate-spin mr-2" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="h-5 w-5 mr-2" aria-hidden="true" />
                  {isEditing ? 'Update Property' : 'Create Property'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Property"
        message="Are you sure you want to delete this property? This action cannot be undone. All associated images and pending bookings will also be removed."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}