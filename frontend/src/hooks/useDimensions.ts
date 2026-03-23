import { useState, useEffect } from 'react';

export const useDimensions = () => {
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth - 400, 
    height: window.innerHeight - 56 
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth - 400,
        height: window.innerHeight - 56
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
};
