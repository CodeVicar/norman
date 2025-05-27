import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 px-4">
      <div className="container mx-auto text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Your App Name. All rights reserved.</p>
        {/* Add more links here if needed, e.g., Privacy Policy, Terms of Service */}
        {/* <div className="mt-4 space-x-4">
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
          <a href="/terms" className="hover:underline">Terms of Service</a>
        </div> */}
      </div>
    </footer>
  );
};

export default Footer; 