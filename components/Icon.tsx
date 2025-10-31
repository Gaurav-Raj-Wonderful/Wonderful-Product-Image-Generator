
import React, { lazy, Suspense } from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
}

// A custom spinner component for consistency
const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// Dynamically import icons from Heroicons
const iconMap: { [key: string]: React.FC<any> } = {
  sun: lazy(() => import('@heroicons/react/24/outline').then(module => ({ default: module.SunIcon }))),
  moon: lazy(() => import('@heroicons/react/24/outline').then(module => ({ default: module.MoonIcon }))),
  eye: lazy(() => import('@heroicons/react/24/outline').then(module => ({ default: module.EyeIcon }))),
  'eye-off': lazy(() => import('@heroicons/react/24/outline').then(module => ({ default: module.EyeSlashIcon }))),
  image: lazy(() => import('@heroicons/react/24/outline').then(module => ({ default: module.PhotoIcon }))),
  'alert-triangle': lazy(() => import('@heroicons/react/24/outline').then(module => ({ default: module.ExclamationTriangleIcon }))),
  copy: lazy(() => import('@heroicons/react/24/outline').then(module => ({ default: module.ClipboardDocumentIcon }))),
  download: lazy(() => import('@heroicons/react/24/outline').then(module => ({ default: module.ArrowDownTrayIcon }))),
  check: lazy(() => import('@heroicons/react/24/outline').then(module => ({ default: module.CheckIcon }))),
  sparkles: lazy(() => import('@heroicons/react/24/outline').then(module => ({ default: module.SparklesIcon }))),
  wand: lazy(() => import('@heroicons/react/24/outline').then(module => ({ default: module.PaintBrushIcon }))),
  'arrow-path': lazy(() => import('@heroicons/react/24/outline').then(module => ({ default: module.ArrowPathIcon }))),
  spinner: SpinnerIcon,
};

export const Icon: React.FC<IconProps> = ({ name, className, ...props }) => {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    return null; // Or a default "icon not found" icon
  }

  const size = className ? '' : 'w-6 h-6';

  return (
    <Suspense fallback={<div className={`${size} ${className}`} />}>
      <IconComponent className={`${size} ${className}`} {...props} />
    </Suspense>
  );
};
