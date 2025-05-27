import React from 'react';

const FeatureItem = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-lg">
    <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mb-4 text-3xl">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const FeaturesSection = () => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Online Screen Recorder Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureItem
            icon="🖥️"
            title="Record Screen"
            description="Capture your entire screen, a specific application window, or a browser tab."
          />
          <FeatureItem
            icon="📷"
            title="Record Camera"
            description="Record directly from your webcam, with various aspect ratio options."
          />
          {/* Removed Record Audio feature as requested */}
          {/* <FeatureItem\n            icon=\"🎧\"\n            title=\"Record Audio\"\n            description=\"Capture audio from your microphone or system audio (browser support varies).\"\n          /> */}
           {/* Adding Screen & Camera as a core feature */}
           <FeatureItem
            icon="🎬"
            title="Screen & Camera"
            description="Record your screen and camera simultaneously with camera as an overlay."
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 