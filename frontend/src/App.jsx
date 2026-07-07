import React from 'react';

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans text-center p-8 bg-gray-50 text-gray-800">
      <h1 className="text-5xl font-extrabold text-blue-600 mb-2">NestQuest</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-2">Intelligent Rental & Real Estate Matchmaker</h2>
      <p className="text-lg text-gray-500 mb-8">AI-Powered Conversational Property Search</p>
      
      <div className="w-full max-w-2xl bg-white p-4 rounded-xl shadow-lg flex items-center border border-gray-200">
        <input 
          type="text" 
          placeholder="E.g. Looking for a pet-friendly apartment near Infopark..." 
          className="flex-grow p-3 text-lg bg-transparent outline-none"
        />
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-md">
          Search
        </button>
      </div>
    </div>
  );
}

export default App;
