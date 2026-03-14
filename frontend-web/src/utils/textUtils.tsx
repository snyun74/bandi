import React from 'react';

/**
 * Converts URLs within a string into clickable <a> tags that open in a new tab.
 * @param text The string to process
 * @returns An array of strings and React elements
 */
export const linkifyText = (text: string): (string | React.ReactNode)[] => {
  if (!text) return [];

  // Regex to find URLs starting with http:// or https://
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#00BDF8] underline hover:text-[#003C48] transition-colors"
          onClick={(e) => e.stopPropagation()} // Prevent triggering parent click events
        >
          {part}
        </a>
      );
    }
    return part;
  });
};
