import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Home, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export function SmartNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show on pure home page
  if (location.pathname === '/') {
    return null;
  }

  const pathSegments = location.pathname.split('/').filter(Boolean);

  const formatSegment = (segment: string) => {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleBack = () => {
    // Navigate back. 
    // The existing ProtectedRoute (IdentityGuard) will intercept and redirect to /auth
    // if they are somehow navigating 'back' into an admin panel without auth.
    navigate(-1);
  };

  return (
    <div className="bg-white/50 dark:bg-[#0a0a0c]/50 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 py-3 sticky top-0 z-30 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center gap-4">
        <motion.button
          onClick={handleBack}
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
          title="Go Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1"></div>

        <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar text-sm font-medium whitespace-nowrap">
          <Link to="/" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
          </Link>
          
          {pathSegments.map((segment, index) => {
            const isLast = index === pathSegments.length - 1;
            const path = `/${pathSegments.slice(0, index + 1).join('/')}`;

            return (
              <React.Fragment key={path}>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600 shrink-0" />
                {isLast ? (
                  <span className="text-gray-900 dark:text-gray-100 font-bold tracking-wide">
                    {formatSegment(segment)}
                  </span>
                ) : (
                  <Link 
                    to={path} 
                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors tracking-wide"
                  >
                    {formatSegment(segment)}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
