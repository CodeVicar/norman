import React from 'react';

const OnlineToolBenefits = () => {
  return (
    <section className="py-20 px-4 bg-purple-700 text-white">
      <div className="container mx-auto flex flex-col lg:flex-row items-center gap-12">
        {/* Content Area */}
        <div className="lg:w-1/2">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Capture, Edit, and Share Effortlessly Online</h2>
          <p className="text-lg mb-6">
            Our free online recorder offers powerful features directly in your browser, no installation needed:
          </p>
          <ul className="list-none space-y-3 mb-8">
            <li className="flex items-center">
              <span className="text-green-400 mr-3 text-xl">✔</span>
              Flexible screen, camera, and audio recording options.
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-3 text-xl">✔</span>
              High-quality output, instantly saved to your device.
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-3 text-xl">✔</span>
              No watermarks, time limits, or hidden fees.
            </li>
             <li className="flex items-center">
              <span className="text-green-400 mr-3 text-xl">✔</span>
              Simple and intuitive interface for easy use.
            </li>
          </ul>
          {/* Adapt the button if you have a specific action here, e.g., learn more */}
          {/* <button className="px-8 py-3 bg-pink-500 text-white font-semibold rounded-full shadow-lg hover:bg-pink-600 transition-colors text-lg">
            Learn More
          </button> */}
        </div>

        {/* Image/Visual Area - Placeholder */}
        {/* Replace this div with an actual image or illustration later */}
        <div className="lg:w-1/2 flex justify-center">
          <div className="w-full max-w-md bg-gray-800 rounded-lg aspect-video flex items-center justify-center text-gray-400">
            [ Placeholder for Online Tool Screenshot/Illustration ]
          </div>
        </div>
      </div>
    </section>
  );
};

export default OnlineToolBenefits; 