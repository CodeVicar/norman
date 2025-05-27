import React from 'react';
import Hero from './Hero';
import FeaturesSection from './FeaturesSection';
import OnlineToolBenefits from './OnlineToolBenefits';
import TestimonialsSection from './TestimonialsSection';
import FAQSection from './FAQSection';
import Footer from './Footer';
import OnlineBenefitsList from './OnlineBenefitsList';
import AIToolsSection from './AIToolsSection';

const Homepage = () => {
  return (
    <div className="flex flex-col">
      <Hero />
      <OnlineBenefitsList />
      <FeaturesSection />
      <OnlineToolBenefits />
      <AIToolsSection />
      <TestimonialsSection />
      <FAQSection />
      <Footer />
      {/* Add other sections like a footer here later if needed */}
    </div>
  );
};

export default Homepage; 