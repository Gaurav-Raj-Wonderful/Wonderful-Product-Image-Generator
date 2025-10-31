import React, { useState } from 'react';
import { Icon } from './Icon';

interface LoginProps {
  onLoginSuccess: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, theme, onToggleTheme }) => {
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        onLoginSuccess();
      } else {
        const data = await response.json();
        setError(data.message || 'Incorrect password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative">
      {/* Theme Toggle Button */}
      <button
        onClick={onToggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
        aria-label="Toggle theme"
      >
        <Icon name={theme === 'light' ? 'moon' : 'sun'} className="h-5 w-5" />
      </button>

      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl px-8 pt-6 pb-8 mb-4 border border-gray-200 dark:border-gray-700"
        >
          <img
            src="/Automation_Stacked.png"
            alt="Brand Logo"
            className="w-48 mx-auto mb-6"
          />
          <h2 className="text-center text-2xl font-bold text-gray-800 dark:text-white mb-8">
            Enter Password
          </h2>

          <div className="mb-6 relative">
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={isLoading}
              className="w-full px-4 py-3 pr-10 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            >
              <Icon name={isPasswordVisible ? 'eye-off' : 'eye'} />
            </button>
          </div>

          {error && (
            <p className="text-center text-red-500 dark:text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
          >
            {isLoading ? (
              <>
                <Icon name="spinner" className="animate-spin h-5 w-5" />
                Logging In...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};