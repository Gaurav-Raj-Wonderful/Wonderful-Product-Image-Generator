import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 mt-8 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>Happy snacking! | <a href="https://www.wonderful.com/brands/wonderful-pistachios/" target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition-colors">© 2025 Wonderful Pistachios</a></p>
      </div>
    </footer>
  );
};