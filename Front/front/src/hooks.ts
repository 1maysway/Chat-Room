import { useEffect, useLayoutEffect, useState } from 'react';
import { debounce } from "lodash"

export const useVisibilityChange = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
};

export const useWindowFocus = () => {
    const [isFocused, setIsFocused] = useState(true);
  
    useEffect(() => {
      const handleFocus = () => {
        setIsFocused(true);
      };

      const handleBlur = () =>{
        setIsFocused(false);
      }
  
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);
  
      return () => {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
      };
    }, []);
  
    return isFocused;
  };

  export const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState(value);
  
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
  
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
  
    return debouncedValue;
  };

  const getOrientation = () =>
  window.screen.orientation.type

export const useScreenOrientation = () => {
  const [orientation, setOrientation] =
    useState(getOrientation())

  const updateOrientation = () => {
    setOrientation(getOrientation())
  }

  useEffect(() => {
    window.addEventListener(
      'orientationchange',
      updateOrientation
    )
    return () => {
      window.removeEventListener(
        'orientationchange',
        updateOrientation
      )
    }
  }, [])

  return orientation
}

export function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }

    const debouncedSize = debounce(updateSize, 300)

    window.addEventListener('resize', debouncedSize);
    updateSize();
    return () => window.removeEventListener('resize', debouncedSize);
  }, []);
  return size;
}