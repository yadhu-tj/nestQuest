import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import UserDashboard from './pages/UserDashboard';
import BrokerDashboard from './pages/BrokerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SearchResults from './pages/SearchResults';
import PropertyDetails from './pages/PropertyDetails';
import Login from './pages/Login';

function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans text-center p-8 bg-gray-50 text-gray-800">
      <h1 className="text-5xl font-extrabold text-blue-600 mb-2">NestQuest</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-2">Intelligent Rental & Real Estate Matchmaker</h2>
      <p className="text-lg text-gray-500 mb-8">AI-Powered Conversational Property Search</p>
      
      <div className="w-full max-w-2xl bg-white p-4 rounded-xl shadow-lg flex items-center border border-gray-200 mb-8">
        <input 
          type="text" 
          placeholder="E.g. Looking for a pet-friendly apartment near Infopark..." 
          className="flex-grow p-3 text-lg bg-transparent outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-md">
          Search
        </button>
      </div>

      <div className="flex gap-4">
        <Link to="/login" className="text-blue-500 hover:underline">Login</Link>
        <Link to="/user" className="text-blue-500 hover:underline">User Dashboard</Link>
        <Link to="/broker" className="text-blue-500 hover:underline">Broker Dashboard</Link>
        <Link to="/admin" className="text-blue-500 hover:underline">Admin Dashboard</Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/broker" element={<BrokerDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
