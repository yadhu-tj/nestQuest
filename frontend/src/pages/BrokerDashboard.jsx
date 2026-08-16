import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialMockProperties = [
  {
    property_id: 1,
    title: 'Charming 2BHK Garden Flat',
    location: 'Palarivattom, Kochi',
    price: 21000,
    status: 'Available',
  },
  {
    property_id: 2,
    title: 'Eco-Friendly 2BHK Cottage in Heritage Zone',
    location: 'Fort Kochi',
    price: 25000,
    status: 'Rented',
  },
];

const BrokerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState(initialMockProperties);

  const handleDelete = (id) => {
    setProperties(properties.filter(p => p.property_id !== id));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Broker Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name || 'Broker'}!</p>
          </div>
          <div className="space-x-4">
             <Link to="/" className="text-blue-600 hover:underline">Home</Link>
             <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Properties</h2>
            <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200">
              + Add New Property
            </button>
          </div>

          {properties.length === 0 ? (
            <p className="text-gray-500">You haven't listed any properties yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 font-semibold text-gray-700">Property</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Location</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Price</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map(property => (
                    <tr key={property.property_id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{property.title}</td>
                      <td className="py-3 px-4">{property.location}</td>
                      <td className="py-3 px-4">₹{property.price}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${property.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {property.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 space-x-3">
                        <Link to={`/properties/${property.property_id}`} className="text-blue-500 hover:underline text-sm">View</Link>
                        <button className="text-gray-500 hover:text-gray-700 text-sm">Edit</button>
                        <button onClick={() => handleDelete(property.property_id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrokerDashboard;
