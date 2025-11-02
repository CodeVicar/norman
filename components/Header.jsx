import React from 'react'
import Link from 'next/link'

const Header = () => {
  return (
    <header className="bg-white shadow-sm py-5 px-6 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-purple-600 font-bold text-xs uppercase">Mosir West  ONLINE</span>
            <span className="text-gray-800 font-bold text-xl">Screen Recorder</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center flex-grow justify-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2">
            Home
          </Link>
          <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2">
            About
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2">
            Contact
          </Link>
        </nav>

        <div className="flex items-center">
          <Link href="/recorder" className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors shadow-md">
            Record Now
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header