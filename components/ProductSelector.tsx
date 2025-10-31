import React, { useState } from 'react';
import type { Product, ProductCategory } from '../types';

interface ProductSelectorProps {
  categories: ProductCategory[];
  selectedProduct: Product | null;
  onSelectProduct: (product: Product) => void;
  secureUrlMap: Record<string, { signedUrl: string; expiresAt: number }>;
  loadingUrls: Set<string>;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  categories,
  selectedProduct,
  onSelectProduct,
  secureUrlMap,
  loadingUrls,
}) => {
  const [activeCategory, setActiveCategory] = useState<ProductCategory>(categories[0]);

  if (!categories || categories.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No products available.</p>;
  }

  const getFlavor = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
      parts.shift();
      return parts.join(' ');
    }
    return name;
  };
  const getSize = (name: string) => name.split(' ')[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center border-b border-gray-200 dark:border-gray-700">
        {categories.map((category) => (
          <button
            key={category.size}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none ${
              activeCategory.size === category.size
                ? 'border-b-2 border-green-500 text-gray-900 dark:text-white font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {category.size}
          </button>
        ))}
      </div>

      {/* Product Grids */}
      <div>
        {categories.map((category) => (
          <div
            key={category.size}
            className={`${activeCategory.size === category.size ? '' : 'hidden'}`}
          >
            {/* Check if category has groups or products */}
            {category.groups ? (
              // Render grouped products
              <div className="space-y-6">
                {category.groups.map((group) => (
                  <div key={group.name}>
                    {/* Group Heading */}
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-1">
                      {group.name}
                    </h3>

                    {/* Group Products Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      {group.products.map((product) => {
                        const isLoading = loadingUrls.has(product.imageUrl);
                        const urlData = secureUrlMap[product.imageUrl];
                        const imageUrl = urlData?.signedUrl;
                        return (
                          <div
                            key={product.name}
                            onClick={() => onSelectProduct(product)}
                            className={`cursor-pointer rounded-lg overflow-hidden transition-all duration-300 group border-2 ${
                              selectedProduct?.name === product.name
                                ? 'border-green-500 shadow-lg'
                                : 'border-transparent hover:border-green-500'
                            }`}
                          >
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                              <div className="aspect-square">
                                {isLoading ? (
                                  <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                                ) : (
                                  <img
                                    src={imageUrl || ''}
                                    alt={product.name}
                                    className="w-full h-full object-contain scale-110 transition-transform duration-300 group-hover:scale-125"
                                    loading="eager"
                                  />
                                )}
                              </div>
                            </div>
                            <div className="p-2">
                              <p className="text-xs text-center text-gray-600 dark:text-gray-400 truncate">
                                {getFlavor(product.name)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Render regular products (no groups)
              <div className="grid grid-cols-3 gap-4">
                {category.products?.map((product) => {
                  const isLoading = loadingUrls.has(product.imageUrl);
                  const urlData = secureUrlMap[product.imageUrl];
                  const imageUrl = urlData?.signedUrl;
                  return (
                    <div
                      key={product.name}
                      onClick={() => onSelectProduct(product)}
                      className={`cursor-pointer rounded-lg overflow-hidden transition-all duration-300 group border-2 ${
                        selectedProduct?.name === product.name
                          ? 'border-green-500 shadow-lg'
                          : 'border-transparent hover:border-green-500'
                      }`}
                    >
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <div className="aspect-square">
                          {isLoading ? (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                          ) : (
                            <img
                              src={imageUrl || ''}
                              alt={product.name}
                              className="w-full h-full object-contain scale-110 transition-transform duration-300 group-hover:scale-125"
                              loading="eager"
                            />
                          )}
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-center text-gray-600 dark:text-gray-400 truncate">
                          {getFlavor(product.name)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Product Name Display */}
      <div className="mt-3" aria-live="polite">
        {selectedProduct && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md 
                            bg-gray-100 dark:bg-gray-700 
                            border border-gray-200 dark:border-gray-600 
                            text-gray-800 dark:text-gray-200 text-sm text-center">
              <span className="font-semibold">
                {(selectedProduct as any).size ?? getSize(selectedProduct.name)}
              </span>
              <span className="opacity-60">•</span>
              <span className="font-medium">
                {getFlavor(selectedProduct.name)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};