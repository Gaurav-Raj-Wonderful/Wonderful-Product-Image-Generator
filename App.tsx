import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { BrandSelector } from './components/BrandSelector';
import { ProductSelector } from './components/ProductSelector';
import { PromptInput } from './components/PromptInput';
import { ImageDisplay } from './components/ImageDisplay';
import { Footer } from './components/Footer';
import { Login } from './components/Login';
import type { Product, Brand } from './types';
import { BRANDS } from './constants';
import { apiClient } from './utils/apiClient';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [secureUrlMap, setSecureUrlMap] = useState<Record<string, { signedUrl: string; expiresAt: number }>>({});
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Initial fetch of all product images on authentication
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchAllProductImageUrls = async () => {
      // Collect all product images and size reference images
      const allImageUrls = new Set<string>();

      // Add all product images
      BRANDS.forEach(brand =>
        brand.categories.forEach(category => {
          if (category.groups) {
            category.groups.forEach(group =>
              group.products.forEach(product => allImageUrls.add(product.imageUrl))
            );
          } else if (category.products) {
            category.products.forEach(product => allImageUrls.add(product.imageUrl));
          }

          // Add size reference images
          if (category.sizeReferenceImage) {
            allImageUrls.add(category.sizeReferenceImage);
          }
        })
      );

      const productsToFetch = Array.from(allImageUrls).filter(url => !secureUrlMap[url]);

      if (productsToFetch.length === 0) return;

      const newLoadingUrls = new Set(productsToFetch);
      setLoadingUrls(newLoadingUrls);

      const urlPromises = productsToFetch.map(imageUrl =>
        apiClient.post<
          { imagePath: string },
          { result: { signedUrl: string; expiresAt: number } }
        >(
          '/api/getImageUrl',
          { imagePath: imageUrl },
          { signal }
        ).then(response => ({
          [imageUrl]: {
            signedUrl: response.result.signedUrl,
            expiresAt: response.result.expiresAt,
          }
        })).catch(error => {
          if (error.name === 'AbortError') {
            console.log(`Request for ${imageUrl} was aborted.`);
            return null;
          }
          console.error(`Error fetching image for ${imageUrl}`, error);
          return {
            [imageUrl]: {
              signedUrl: '/path/to/error-image.png',
              expiresAt: 0,
            }
          };
        })
      );

      try {
        const resolvedUrls = await Promise.all(urlPromises);
        if (!signal.aborted) {
          const newUrlMap = Object.assign({}, ...resolvedUrls.filter(Boolean));
          setSecureUrlMap(prevMap => ({ ...prevMap, ...newUrlMap }));
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error("Failed to fetch some product images.", error);
        }
      } finally {
        if (!signal.aborted) {
          setLoadingUrls(new Set());
        }
      }
    };

    // Only fetch if user is authenticated and we haven't fetched all brands yet
    if (isAuthenticated && Object.keys(secureUrlMap).length === 0) {
      fetchAllProductImageUrls();
    }

    return () => {
      controller.abort();
    };
  }, [isAuthenticated]);

  // Refresh URLs that are about to expire
  useEffect(() => {
    if (!isAuthenticated || Object.keys(secureUrlMap).length === 0) return;

    const checkAndRefreshUrls = async () => {
      const now = Date.now();
      const urlsToRefresh: string[] = [];

      // Check which URLs are about to expire (within 10 minutes)
      Object.entries(secureUrlMap).forEach(([url, data]) => {
        if (typeof data === 'object' && data.expiresAt) {
          const timeUntilExpiry = data.expiresAt - now;
          if (timeUntilExpiry < 10 * 60 * 1000) { // Less than 10 minutes
            urlsToRefresh.push(url);
          }
        }
      });

      if (urlsToRefresh.length === 0) return;

      console.log(`Refreshing ${urlsToRefresh.length} expiring URLs...`);

      const refreshPromises = urlsToRefresh.map(imageUrl =>
        apiClient.post<
          { imagePath: string },
          { result: { signedUrl: string; expiresAt: number } }
        >(
          '/api/getImageUrl',
          { imagePath: imageUrl }
        ).then(response => ({
          [imageUrl]: {
            signedUrl: response.result.signedUrl,
            expiresAt: response.result.expiresAt,
          }
        })).catch(error => {
          console.error(`Error refreshing URL for ${imageUrl}:`, error);
          return null;
        })
      );

      try {
        const refreshedUrls = await Promise.all(refreshPromises);
        const newUrlMap = Object.assign({}, ...refreshedUrls.filter(Boolean));
        setSecureUrlMap(prevMap => ({ ...prevMap, ...newUrlMap }));
      } catch (error) {
        console.error("Failed to refresh some URLs.", error);
      }
    };

    // Check every 5 minutes
    const refreshInterval = setInterval(checkAndRefreshUrls, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, secureUrlMap]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
    // Reset product selection when brand changes
    setSelectedProduct(null);
    setPrompt('');
    setGeneratedImageUrl(null);
    setGeneratedText('');
    setError(null);
  };

  const handleBrandChange = () => {
    setSelectedBrand(null);
    setSelectedProduct(null);
    setPrompt('');
    setGeneratedImageUrl(null);
    setGeneratedText('');
    setError(null);
    // Don't clear secureUrlMap anymore - keep cached URLs
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt || !selectedProduct) {
      setError('Please select a product and enter a prompt.');
      return;
    }

    const wordCount = prompt.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 6000) {
      setError('Prompt limit exceeded. Please keep your prompt under 6000 words.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);
    setGeneratedText('');

    try {
      // Find the size reference image from the selected brand's category
      const selectedCategory = selectedBrand?.categories.find(cat => {
        if (cat.products) {
          return cat.products.some(p => p.name === selectedProduct.name);
        } else if (cat.groups) {
          return cat.groups.some(group =>
            group.products.some(p => p.name === selectedProduct.name)
          );
        }
        return false;
      });

      let sizeReferenceImageUrl: string | undefined = undefined;
      if (selectedCategory?.sizeReferenceImage) {
        sizeReferenceImageUrl = selectedCategory.sizeReferenceImage;
      }

      const response = await apiClient.post<
        { type: string; prompt: string; imageUrl: string; sizeReferenceImageUrl?: string },
        { result: { imageUrl?: string; text?: string } }
      >('/api/generate', {
        type: 'generate',
        prompt,
        imageUrl: selectedProduct.imageUrl,
        sizeReferenceImageUrl,
      });

      const result = response.result;

      if (result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
        setGeneratedText(result.text || '');
      } else {
        setError(result.text || 'Failed to generate image. The model may not have returned an image.');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, selectedProduct, selectedBrand]);

  const handleOptimizePrompt = useCallback(async () => {
    if (!prompt) {
      setError("Please enter a prompt to optimize.");
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      const response = await apiClient.post<
        { type: string; prompt: string },
        { result: { text?: string } }
      >('/api/generate', { type: 'optimize', prompt });
      const result = response.result;
      if (result.text) {
        setPrompt(result.text);
      } else {
        throw new Error("The model did not return an optimized prompt.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during optimization.');
    } finally {
      setIsOptimizing(false);
    }
  }, [prompt]);

  const handleReset = useCallback(() => {
    setPrompt('');
    setSelectedProduct(null);
    setGeneratedImageUrl(null);
    setGeneratedText('');
    setError(null);
  }, []);

  return (
    <div
      className={`min-h-screen font-sans flex flex-col selection:bg-green-500 selection:text-white ${theme === 'light'
          ? 'bg-white bg-gradient-to-br from-[#F1CB76]/65 via-[#F1CB76]/45 to-white text-gray-800'
          : 'bg-gray-900 text-gray-200'
        }`}
    >
      {!isAuthenticated ? (
        <Login onLoginSuccess={handleLoginSuccess} theme={theme} onToggleTheme={toggleTheme} />
      ) : !selectedBrand ? (
        <BrandSelector brands={BRANDS} onSelectBrand={handleBrandSelect} theme={theme} onToggleTheme={toggleTheme} />
      ) : (
        <>
          <Header
            onChangeBrand={handleBrandChange}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
          <main className="flex-grow container mx-auto px-2 py-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-4">1. Select a Reference Product</h2>
                <ProductSelector
                  categories={selectedBrand.categories}
                  selectedProduct={selectedProduct}
                  onSelectProduct={setSelectedProduct}
                  secureUrlMap={secureUrlMap}
                  loadingUrls={loadingUrls}
                />
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">
                <h2 className="text-xl font-bold mb-4">2. Describe the Scene</h2>
                <PromptInput
                  prompt={prompt}
                  setPrompt={setPrompt}
                  onGenerate={handleGenerate}
                  onReset={handleReset}
                  onOptimize={handleOptimizePrompt}
                  isLoading={isLoading}
                  isOptimizing={isOptimizing}
                  disabled={!selectedProduct}
                />
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">
                <h2 className="text-xl font-bold mb-4">3. Preview</h2>
                <ImageDisplay
                  imageUrl={generatedImageUrl}
                  text={generatedText}
                  isLoading={isLoading}
                  error={error}
                />
              </div>
            </div>
          </main>
          <Footer />
        </>
      )}
    </div>
  );
}
export default App;