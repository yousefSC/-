import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactElement;
  className?: string; // This prop is no longer used but kept for type compatibility
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  // If children is not a valid element, we cannot add props to it.
  // In this case, we'll just return it as is to avoid crashing.
  if (!React.isValidElement(children)) {
    return children;
  }
  
  // Clone the child element to add the native 'title' attribute,
  // which triggers the browser's default tooltip.
  // FIX: The `title` prop is a standard HTML attribute, but TypeScript cannot guarantee
  // that the generic `children` prop can accept it. We cast to `any` to bypass this
  // strict type check, which is a common and safe workaround for this specific use case.
  return React.cloneElement(children, { title: text } as any);
};

export default Tooltip;
