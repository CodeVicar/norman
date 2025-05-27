import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex flex-col items-center md:items-start">
          <Link href="/" className="flex flex-col leading-none mb-4">
            <span className="text-purple-400 font-bold text-xs uppercase">FREE ONLINE</span>
            <span className="text-white font-bold text-xl">Screen Recorder</span>
          </Link>
          <p className="text-sm text-center md:text-left">&copy; {new Date().getFullYear()} Your App Name. All rights reserved.</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4 text-center md:text-left">Navigation</h3>
          <ul className="space-y-2 text-center md:text-left">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            <li><Link href="/recorder" className="hover:text-white transition-colors">Recorder</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4 text-center md:text-left">Resources</h3>
          <ul className="space-y-2 text-center md:text-left">
            <li><Link href="#faq" className="hover:text-white transition-colors">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4 text-center md:text-left">Legal</h3>
          <ul className="space-y-2 text-center md:text-left">
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;