import React from 'react';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="flex items-center justify-center py-12 md:py-16 px-4 bg-gradient-to-br from-green-50 to-white overflow-hidden relative">
      {/* Optional: Subtle background pattern */}
       {/* <div className="absolute inset-0 bg-repeat opacity-10" style={{ backgroundImage: 'url(/path/to/pattern.svg)' }}></div> */}

      <div className="container mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
        {/* Left Column: Text and Features */}
        <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0">
          {/* Small Badge/Tagline */}
          <span className="inline-block bg-green-200 text-green-800 text-sm font-semibold px-3 py-1 rounded-full mb-3">
            Your Free Online Recorder
          </span>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 leading-tight text-gray-900">
            Give Your <span className="text-green-600">Audience Instant</span> <br/> Access to Your Content
          </h1>

          {/* Subheading/Description */}
          <p className="text-lg md:text-xl mb-8 max-w-xl text-gray-700">
            Record high-quality screen, camera, and audio directly from your browser. <br className="hidden md:inline"/>Share your knowledge effortlessly, without downloads or extensions.
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
            <Link href="/recorder" className="inline-block px-8 py-3 bg-green-500 text-white font-bold rounded-full shadow-lg hover:bg-green-600 transition-colors text-lg transform hover:scale-105 duration-300 ease-in-out">
                Get Started &rarr;
            </Link>
             {/* Optional: Secondary Button */}
            {/* <Link href="#learn-more" className="inline-block px-8 py-3 border border-gray-400 text-gray-700 font-bold rounded-full shadow-lg hover:bg-gray-200 transition-colors text-lg">
                Learn More
            </Link> */}
          </div>
        </div>

        {/* Right Column: Visual */}
        <div className="md:w-1/2 flex justify-center">
          {/* Placeholder for the image/visual */}
          {/* Replace with your actual image */}
          <div className="w-full max-w-xl aspect-video bg-gray-300 rounded-lg flex items-center justify-center text-gray-700 text-center overflow-hidden shadow-xl">
              [ Placeholder for Product Screenshot/Demo ]
               {/* You would typically place your Image component or a video here */}
                {/* <Image src="/path/to/your-screenshot.png" alt="Product Screenshot" width={...} height={...} layout="responsive" /> */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 