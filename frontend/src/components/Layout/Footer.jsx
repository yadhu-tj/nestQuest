import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiSearch, FiUser, FiBriefcase, FiMail, FiMapPin, FiPhone, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Home', to: '/', icon: FiHome },
      { label: 'Search Properties', to: '/search', icon: FiSearch },
      { label: 'How It Works', to: '/#how-it-works', icon: FiUser },
      { label: 'For Brokers', to: '/broker', icon: FiBriefcase },
    ],
    company: [
      { label: 'About NestQuest', to: '/#about', icon: FiHome },
      { label: 'Careers', to: '/#careers', icon: FiUser },
      { label: 'Blog', to: '/#blog', icon: FiSearch },
      { label: 'Press', to: '/#press', icon: FiBriefcase },
    ],
    support: [
      { label: 'Help Center', to: '/#help', icon: FiUser },
      { label: 'Contact Us', to: '/#contact', icon: FiMail },
      { label: 'Privacy Policy', to: '/#privacy', icon: FiBriefcase },
      { label: 'Terms of Service', to: '/#terms', icon: FiHome },
    ],
  };

  const contactInfo = {
    address: 'Kochi, Kerala, India',
    email: 'support@nestquest.com',
    phone: '+91-XXXXXXXXXX',
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Link to="/" className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              NestQuest
            </Link>
            <p className="mt-4 text-gray-600 text-sm leading-relaxed max-w-xs">
              Intelligent Rental & Real Estate Matchmaker — AI-powered conversational property search
              for modern home seekers.
            </p>
            <div className="mt-6 flex space-x-6">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Twitter">
                <FiTwitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="LinkedIn">
                <FiLinkedin className="h-5 w-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="GitHub">
                <FiGithub className="h-5 w-5" />
              </a>
              <a href="mailto:support@nestquest.com" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Email">
                <FiMail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Product</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <link.icon className="mr-2 h-4 w-4 text-gray-400" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <link.icon className="mr-2 h-4 w-4 text-gray-400" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Support</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <link.icon className="mr-2 h-4 w-4 text-gray-400" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {currentYear} NestQuest. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 text-sm text-gray-500">
              <span className="flex items-center">
                <FiMapPin className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {contactInfo.address}
              </span>
              <span className="flex items-center">
                <FiMail className="mr-1.5 h-4 w-4" aria-hidden="true" />
                <a href={`mailto:${contactInfo.email}`} className="hover:text-blue-600 transition-colors">
                  {contactInfo.email}
                </a>
              </span>
              <span className="flex items-center">
                <FiPhone className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {contactInfo.phone}
              </span>
            </div>
            <p className="text-sm text-gray-500 text-center md:text-right">
              Built with React, Flask, PostgreSQL, ChromaDB & Google Gemini
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}