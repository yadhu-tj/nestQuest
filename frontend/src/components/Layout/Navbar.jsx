import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiLogIn, FiUserPlus, FiSearch, FiLogOut, FiUser, FiBriefcase, FiSettings, FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
  const { user, isAuthenticated, role, logout, loading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { path: '/', label: 'Home', icon: FiHome, public: true },
    { path: '/search', label: 'Search', icon: FiSearch, public: false, roles: ['user', 'broker', 'admin'] },
  ];

  const getDashboardPath = (userRole) => {
    switch (userRole) {
      case 'admin':
        return '/admin';
      case 'broker':
        return '/broker';
      case 'user':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  };

  const getDashboardLabel = (userRole) => {
    switch (userRole) {
      case 'admin':
        return 'Admin Dashboard';
      case 'broker':
        return 'Broker Dashboard';
      case 'user':
        return 'My Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const getDashboardIcon = (userRole) => {
    switch (userRole) {
      case 'admin':
        return FiSettings;
      case 'broker':
        return FiBriefcase;
      case 'user':
        return FiUser;
      default:
        return FiUser;
    }
  };

  if (loading) {
    return (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                NestQuest
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              NestQuest
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
              const showLink = link.public || (isAuthenticated && (!link.roles || link.roles.includes(role)));
              if (!showLink) return null;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <link.icon className="mr-2 h-5 w-5" aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}

            {isAuthenticated && (
              <>
                <Link
                  to={getDashboardPath(role)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname.startsWith(getDashboardPath(role)) || location.pathname === getDashboardPath(role)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {(() => {
                    const Icon = getDashboardIcon(role);
                    return <Icon className="mr-2 h-5 w-5" aria-hidden="true" />;
                  })()}
                  {getDashboardLabel(role)}
                </Link>

                <div className="flex items-center pl-3 border-l border-gray-200">
                  <span className="text-sm text-gray-500 mr-3 hidden sm:block">
                    {user?.name || user?.email}
                  </span>
                  <button
                    onClick={logout}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <FiLogOut className="mr-2 h-5 w-5" aria-hidden="true" />
                    Logout
                  </button>
                </div>
              </>
            )}

            {!isAuthenticated && (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <FiLogIn className="mr-2 h-5 w-5" aria-hidden="true" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <FiUserPlus className="mr-2 h-5 w-5" aria-hidden="true" />
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                const showLink = link.public || (isAuthenticated && (!link.roles || link.roles.includes(role)));
                if (!showLink) return null;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <link.icon className="mr-3 h-6 w-6" aria-hidden="true" />
                    {link.label}
                  </Link>
                );
              })}

              {isAuthenticated && (
                <>
                  <Link
                    to={getDashboardPath(role)}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      location.pathname.startsWith(getDashboardPath(role)) || location.pathname === getDashboardPath(role)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {(() => {
                      const Icon = getDashboardIcon(role);
                      return <Icon className="mr-3 h-6 w-6" aria-hidden="true" />;
                    })()}
                    {getDashboardLabel(role)}
                  </Link>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="px-3 text-sm text-gray-500">{user?.name || user?.email}</p>
                    <button
                      onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                      className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <FiLogOut className="mr-3 h-6 w-6" aria-hidden="true" />
                      Logout
                    </button>
                  </div>
                </>
              )}

              {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <FiLogIn className="mr-3 h-6 w-6" aria-hidden="true" />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <FiUserPlus className="mr-3 h-6 w-6" aria-hidden="true" />
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}