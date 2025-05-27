'use client';

import React, { useState } from "react";
import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  const handleCardClick = (type) => {
    router.push(`/${type}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-8">
      <h1 className="text-2xl font-bold mb-8">What would you like to record?</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Camera Card */}
        <div
          className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleCardClick('camera')}
        >
          {/* Replace with Camera Icon/Image */}
          <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mb-4">📷</div>
          <span className="text-lg font-semibold">Camera</span>
        </div>

        {/* Audio Card */}
        <div
          className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleCardClick('audio')}
        >
          {/* Replace with Audio Icon/Image */}
          <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mb-4">🎧</div>
          <span className="text-lg font-semibold">Audio</span>
        </div>

        {/* Screen Card */}
        <div
          className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleCardClick('screen')}
        >
          {/* Replace with Screen Icon/Image */}
          <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mb-4">🖥️</div>
          <span className="text-lg font-semibold">Screen</span>
        </div>

        {/* Screen & Camera Card */}
        <div
          className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleCardClick('ScreenCamera')}
        >
          {/* Replace with Screen & Camera Icon/Image */}
          <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center mb-4">듀오</div> {/* Placeholder Icon */}
          <span className="text-lg font-semibold">Screen & Camera</span>
        </div>

        {/* Add Slides & Camera and Slides later if needed */}
      </div>
    </div>
  );
};

export default Home; 