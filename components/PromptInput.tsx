
import React from 'react';
import { Icon } from './Icon';

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  onReset: () => void;
  onOptimize: () => void;
  isLoading: boolean;
  isOptimizing: boolean;
  disabled: boolean;
}

const MAX_PROMPT_WORDS = 6000;

export const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt, onGenerate, onReset, onOptimize, isLoading, isOptimizing, disabled }) => {
  const isAnyLoading = isLoading || isOptimizing;
  const wordCount = prompt.trim().split(/\s+/).filter(Boolean).length;
  const isOverLimit = wordCount > MAX_PROMPT_WORDS;

  const baseTextareaClasses = "w-full h-full min-h-[150px] bg-white dark:bg-gray-900 border-2 rounded-lg p-3 focus:ring-2 transition-colors duration-200 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed resize-none";
  const statefulTextareaClasses = isOverLimit
    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
    : "border-gray-300 dark:border-gray-700 focus:ring-green-500 focus:border-green-500";
  
  return (
    <div className="flex flex-col gap-4 flex-grow">
      <div className="relative flex-grow">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={disabled ? "Select a product first..." : "e.g., A photo of the product on a rustic wooden table next to a window."}
          className={`${baseTextareaClasses} ${statefulTextareaClasses}`}
          disabled={disabled || isAnyLoading}
        />
      </div>

      {isOverLimit && (
        <div className="text-sm text-red-600 dark:text-red-500 text-center -mt-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
          Prompt is too long. Please reduce the word count to generate an image.
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={onOptimize}
          disabled={isAnyLoading || disabled || !prompt.trim()}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isOptimizing ? (
            <>
              <Icon name="spinner" className="animate-spin h-5 w-5" />
              Optimizing...
            </>
          ) : (
            <>
              <Icon name="wand" className="h-5 w-5" />
              Optimize Prompt
            </>
          )}
        </button>
        <button
          onClick={onGenerate}
          disabled={isAnyLoading || disabled || !prompt.trim() || isOverLimit}
          className="flex items-center justify-center gap-2 w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
        >
          {isLoading ? (
            <>
              <Icon name="spinner" className="animate-spin h-5 w-5" />
              Generating...
            </>
          ) : (
            <>
              <Icon name="sparkles" className="h-5 w-5" />
              Generate Image
            </>
          )}
        </button>
        <button
          onClick={onReset}
          disabled={isAnyLoading}
          className="flex items-center justify-center gap-2 w-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors duration-200"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
