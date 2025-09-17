import { useEffect } from 'react';
import { useLocation } from 'wouter';

// Persist current page to localStorage (no scroll position tracking)
const CURRENT_PAGE_KEY = 'altaftoolshub_current_page';

export function useNavigationMemory() {
  const [location, navigate] = useLocation();

  // Save current page to localStorage whenever location changes
  useEffect(() => {
    if (location) {
      localStorage.setItem(CURRENT_PAGE_KEY, location);
    }
  }, [location]);

  // On initial load, check if we should restore to a different page
  useEffect(() => {
    const savedPage = localStorage.getItem(CURRENT_PAGE_KEY);
    if (savedPage && savedPage !== location && savedPage !== '/' && location === '/') {
      // Only navigate to saved page if we're on home page and have a different saved page
      navigate(savedPage);
    }
  }, []); // Run only once on mount

  return {
    clearHistory: () => localStorage.removeItem(CURRENT_PAGE_KEY),
    getCurrentPage: () => localStorage.getItem(CURRENT_PAGE_KEY)
  };
}