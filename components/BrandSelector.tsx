import React, { useState, useRef, useEffect } from 'react';
import type { Brand } from '../types';
import { Icon } from './Icon';

interface BrandSelectorProps {
  brands: Brand[];
  onSelectBrand: (brand: Brand) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const BrandSelector: React.FC<BrandSelectorProps> = ({
  brands,
  onSelectBrand,
  theme,
  onToggleTheme,
}) => {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  const handleSelectBrand = (brand: Brand) => {
    setSelectedBrand(brand);
  };

  const handleNext = () => {
    if (selectedBrand) {
      onSelectBrand(selectedBrand);
    }
  };

  // Check if we need scroll buttons (only show if there are more than 3 brands or if content overflows)
  const needsScrollButtons = brands.length > 3;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-4">
      {/* Theme Toggle Button */}
      <button
        onClick={onToggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
        aria-label="Toggle theme"
      >
        <Icon name={theme === 'light' ? 'moon' : 'sun'} className="h-5 w-5" />
      </button>

      {/* Header Section */}
      <div className="text-center mb-6 animate-fade-in flex-shrink-0">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-500 via-blue-500 to-red-500 bg-clip-text text-transparent leading-snug">
          Welcome to Wonderful Image Generator
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400 mb-1">
          Select a brand to get started
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Choose your product line and create stunning visuals
        </p>
      </div>

      {/* Brand Selector Container */}
      <div className="w-full max-w-6xl flex flex-col items-center flex-1 min-h-0">
        {/* Scroll Buttons and Cards Container */}
        <div className="flex items-center justify-center gap-4 w-full flex-1 min-h-0 overflow-hidden">
          {/* Left Scroll Button - Only show if needed */}
          {needsScrollButtons && (
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`flex-shrink-0 p-3 rounded-full transition-all duration-300 ${
                canScrollLeft
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:shadow-lg hover:scale-110'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Scroll left"
            >
              <Icon name="chevron-left" className="h-6 w-6" />
            </button>
          )}

          {/* Scrollable Brand Cards */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className={`flex-1 overflow-x-auto scrollbar-hide flex items-center justify-center min-h-0 ${needsScrollButtons ? '' : 'justify-center'}`}
          >
            <div className={`flex gap-6 px-4 py-4 ${needsScrollButtons ? '' : 'mx-auto'}`}>
              {brands.map((brand, index) => (
                <div
                  key={brand.id}
                  className="flex-shrink-0 w-64 h-72 animate-slide-up"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <button
                    onClick={() => handleSelectBrand(brand)}
                    className={`w-full h-full group relative transition-all duration-500 transform ${
                      selectedBrand?.id === brand.id
                        ? 'scale-105'
                        : 'hover:scale-102'
                    }`}
                  >
                    {/* Card with Outline */}
                    <div
                      className={`w-full h-full rounded-2xl transition-all duration-300 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 ${
                        selectedBrand?.id === brand.id
                          ? 'shadow-2xl'
                          : 'shadow-lg hover:shadow-xl'
                      }`}
                      style={{
                        outline: selectedBrand?.id === brand.id ? `3px solid ${brand.color}` : 'none',
                        outlineOffset: selectedBrand?.id === brand.id ? '3px' : '0px',
                      }}
                    >
                      {/* Background Gradient Overlay */}
                      <div
                        className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300 rounded-2xl pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, ${brand.color}40 0%, ${brand.color}20 100%)`,
                        }}
                      />

                      {/* Card Content */}
                      <div className="relative rounded-2xl p-5 h-full flex flex-col items-center justify-between">
                        {/* Product Image */}
                        <div className="w-full h-32 flex items-center justify-center mb-1 flex-shrink-0 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12"
                        style={{
                          filter: `drop-shadow(0 4px 12px ${brand.color}40)`,
                        }}>
                          <img
                            src={brand.image}
                            alt={brand.displayName}
                            className="h-full w-auto object-contain"
                            onError={(e) => {
                              // Fallback to emoji if image not found
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>

                        {/* Brand Name */}
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 text-center line-clamp-2">
                          {brand.displayName}
                        </h2>

                        {/* Description */}
                        <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-3 line-clamp-2 flex-shrink-0">
                          {brand.description}
                        </p>

                        {/* Selection Indicator Bar */}
                        <div
                          className={`w-full h-1 rounded-full transition-all duration-300 flex-shrink-0 ${
                            selectedBrand?.id === brand.id
                              ? 'opacity-100'
                              : 'opacity-0 group-hover:opacity-50'
                          }`}
                          style={{ backgroundColor: brand.color }}
                        />

                        {/* Checkmark */}
                        {selectedBrand?.id === brand.id && (
                          <div
                            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center animate-scale-in shadow-lg flex-shrink-0"
                            style={{ backgroundColor: brand.color }}
                          >
                            <Icon name="check" className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Scroll Button - Only show if needed */}
          {needsScrollButtons && (
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`flex-shrink-0 p-3 rounded-full transition-all duration-300 ${
                canScrollRight
                  ? 'bg-gradient-to-r from-blue-500 to-red-500 text-white hover:shadow-lg hover:scale-110'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Scroll right"
            >
              <Icon name="chevron-right" className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Next Button and Selection Info */}
        <div className="flex flex-col items-center gap-3 mt-6 flex-shrink-0">
          <button
            onClick={handleNext}
            disabled={!selectedBrand}
            className={`group relative px-10 py-2 rounded-xl font-bold text-base transition-all duration-300 transform ${
              selectedBrand
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-2xl hover:scale-105 active:scale-95'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>Next</span>
              <Icon
                name="arrow-right"
                className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
              />
            </div>

            {/* Button Glow */}
            {selectedBrand && (
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300 -z-10"
                style={{
                  background: `linear-gradient(135deg, ${selectedBrand.color}60 0%, ${selectedBrand.color}20 100%)`,
                }}
              />
            )}
          </button>

          {/* Selection Info */}
          {selectedBrand && (
            <div className="animate-fade-in">
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                You selected <span className="font-bold" style={{ color: selectedBrand.color }}>
                  {selectedBrand.displayName}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};