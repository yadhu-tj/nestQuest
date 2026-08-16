import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

// Mock data for properties
const mockProperties = {
  1: {
    property_id: 1,
    title: 'Charming 2BHK Garden Flat',
    description: 'A beautiful 2 bedroom garden flat in a quiet residential area. Comes with a private garden, modular kitchen, and covered parking. Pet friendly and close to local amenities.',
    price: 21000,
    location: 'Palarivattom, Kochi',
    property_type: 'Apartment',
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1100,
    availability_status: 'Available',
    images: ['https://via.placeholder.com/800x400?text=Garden+Flat+1', 'https://via.placeholder.com/800x400?text=Garden+Flat+2']
  },
  2: {
    property_id: 2,
    title: 'Eco-Friendly 2BHK Cottage in Heritage Zone',
    description: 'Experience sustainable living in this charming eco-friendly cottage located in the heart of the heritage zone. Features include solar water heater, rainwater harvesting, and upcycled wood furniture. Pet friendly with a small backyard.',
    price: 25000,
    location: 'Fort Kochi',
    property_type: 'House',
    bedrooms: 2,
    bathrooms: 1,
    area_sqft: 950,
    availability_status: 'Available',
    images: ['https://via.placeholder.com/800x400?text=Eco+Cottage+1']
  },
  3: {
    property_id: 3,
    title: 'Gated 3BHK Apartment near Technopark Campus',
    description: 'Spacious 3 bedroom apartment in a premium gated community. Just minutes away from Technopark. The community allows pets and has a dedicated dog park. Amenities include a swimming pool, gym, and 24/7 security.',
    price: 26000,
    location: 'Kazhakkoottam, Trivandrum',
    property_type: 'Apartment',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 1500,
    availability_status: 'Available',
    images: ['https://via.placeholder.com/800x400?text=Gated+Apt+1']
  },
  4: {
    property_id: 4,
    title: 'Minimalist Studio Apartment',
    description: 'A cozy and modern minimalist studio apartment ideal for young professionals. Fully furnished with smart space-saving furniture. Pet friendly building with a pet washing station in the basement.',
    price: 13500,
    location: 'Kakkanad, Kochi',
    property_type: 'Studio',
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 450,
    availability_status: 'Available',
    images: ['https://via.placeholder.com/800x400?text=Studio+1']
  },
  5: {
    property_id: 5,
    title: 'Cozy 1BHK Studio near Metro Station',
    description: 'Conveniently located 1BHK studio just a 5-minute walk from the metro station. Well-ventilated and bright. Pet friendly landlord. Perfect for singles or couples.',
    price: 12000,
    location: 'Edappally, Kochi',
    property_type: 'Studio',
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 500,
    availability_status: 'Available',
    images: ['https://via.placeholder.com/800x400?text=Cozy+Studio+1']
  },
};

const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Simulate fetching data
    const fetchProperty = () => {
      setLoading(true);
      setTimeout(() => {
        const data = mockProperties[id];
        if (data) {
          setProperty(data);
          setError(null);
        } else {
          setError('Property not found');
          setProperty(null);
        }
        setLoading(false);
      }, 300); // Small delay to simulate network request
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">Loading property details...</div>;
  }

  if (error || !property) {
    return (
      <div className="p-8 text-center text-red-600">
        <p className="text-xl font-semibold mb-4">{error}</p>
        <Link to="/" className="text-blue-600 hover:underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link to="/" className="text-blue-600 hover:underline mb-6 inline-block">&larr; Back to Results</Link>

      <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
      <p className="text-gray-600 mb-6">{property.location} • ₹{property.price}</p>

      {/* Image Gallery (Mock) */}
      <div className="mb-8 rounded-lg overflow-hidden relative bg-gray-100">
        {property.images && property.images.length > 0 ? (
          <>
            <img
              src={property.images[currentImageIndex]}
              alt={property.title}
              className="w-full h-96 object-cover"
            />
            {property.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                {property.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-3 h-3 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-96 flex items-center justify-center text-gray-400">
            No image available
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Description</h2>
          <p className="text-gray-700 leading-relaxed mb-6">{property.description}</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg h-fit">
          <h3 className="text-xl font-semibold mb-4">Property Details</h3>
          <ul className="space-y-3">
             <li className="flex justify-between">
              <span className="text-gray-600">Type</span>
              <span className="font-medium">{property.property_type}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">Bedrooms</span>
              <span className="font-medium">{property.bedrooms}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">Bathrooms</span>
              <span className="font-medium">{property.bathrooms}</span>
            </li>
             <li className="flex justify-between">
              <span className="text-gray-600">Area</span>
              <span className="font-medium">{property.area_sqft} sqft</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-green-600">{property.availability_status}</span>
            </li>
          </ul>

          <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition duration-200">
            Contact Agent
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
