import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls the page to the top on route change.
 * Prevents double scrollbar flash when navigating between pages with different heights.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use instant scroll to prevent visual flash
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
};
