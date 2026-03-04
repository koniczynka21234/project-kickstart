import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls the page to the top on route change.
 * Targets the main scroll container in AppLayout (the div with overflow-y-auto),
 * and falls back to window.scrollTo for non-layout pages.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollContainer = document.querySelector('[data-scroll-container="main"]');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
};
