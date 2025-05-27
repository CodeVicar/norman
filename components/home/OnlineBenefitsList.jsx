import React from 'react';

const BenefitItem = ({ text }) => (
  <div className="flex items-center text-gray-700">
    <svg className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    <span>{text}</span>
  </div>
);

const OnlineBenefitsList = () => {
  const benefits = [
    "Free and easy to use",
    "No signup required",
    "High-quality output",
    "Instantly saved to your device",
    "No watermark",
    "Unlimited recordings", // Assuming unlimited recordings are offered
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto">
         {/* Optional: Add a heading if needed, but the hero might cover this */}
         {/* <h2 className="text-2xl font-bold text-center mb-8">Why Choose Our Free Online Recorder?</h2> */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <BenefitItem key={index} text={benefit} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default OnlineBenefitsList; 