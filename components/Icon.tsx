
import React from 'react';
import { icons, LucideProps } from 'lucide-react';

type IconProps = LucideProps & {
  name: string;
};

const Icon: React.FC<IconProps> = ({ name, className, size, ...props }) => {
  // lucide-react uses PascalCase names for its icons (e.g., 'ArrowUp').
  // This converts the kebab-case names used in the app (e.g., 'arrow-up') to PascalCase.
  const pascalCaseName = name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  const LucideIcon = icons[pascalCaseName as keyof typeof icons];

  if (!LucideIcon) {
    console.warn(`Icon not found: ${name} (converted to ${pascalCaseName})`);
    // Render a placeholder to prevent layout shift and show what's missing
    return <span style={{ width: size || 24, height: size || 24, display: 'inline-block' }} className={className} />;
  }

  return <LucideIcon className={className} size={size} {...props} />;
};

export default Icon;
