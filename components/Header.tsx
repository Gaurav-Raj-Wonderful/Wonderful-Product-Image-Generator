import React from 'react';
import { Icon } from './Icon';

interface HeaderProps {
  onChangeBrand?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onChangeBrand, theme = 'dark', onToggleTheme }) => {
  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center h-12 flex-shrink-0">
            <img src="/Automation_Stacked.png" alt="Wonderful AI+Automation" className="h-12" />
          </div>

          {/* Centered Title */}
          <div className="flex-1 flex justify-center items-center min-w-0">
            <h1 className="py-1 text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white text-center whitespace-nowrap">
              <span className="sm:hidden">Image Gen</span>
              <span className="hidden sm:inline">TWC Product Image Generator</span>
            </h1>
          </div>
          
          {/* Right Section - Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onChangeBrand && (
              <button
                onClick={onChangeBrand}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 text-sm font-medium whitespace-nowrap"
                title="Switch to a different brand"
              >
                <Icon name="refresh-cw" className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Change Brand</span>
                <span className="sm:hidden">Brand</span>
              </button>
            )}
            
            {/* Theme Toggle */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Toggle theme"
              >
                <Icon name={theme === 'light' ? 'moon' : 'sun'} className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-red-500 rounded-full"></div>
      </div>
    </header>
  );
};