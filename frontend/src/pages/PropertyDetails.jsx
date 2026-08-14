import React from 'react';
import { useParams } from 'react-router-dom';

const PropertyDetails = () => {
  const { id } = useParams();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Property Details</h1>
      <p>Viewing details for property ID: {id}</p>
    </div>
  );
};

export default PropertyDetails;
