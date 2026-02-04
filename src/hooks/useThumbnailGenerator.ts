import { useCallback } from 'react';
import { toJpeg } from 'html-to-image';

interface ThumbnailOptions {
  elementId: string;
  backgroundColor?: string;
  pixelRatio?: number;
  quality?: number;
  width?: number;
  height?: number;
}

/**
 * Wait for DOM to be fully painted and stable
 */
const waitForPaint = (): Promise<void> => {
  return new Promise(resolve => {
    // Double RAF ensures styles are applied and layout is complete
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
};

/**
 * Wait for images inside element to load
 */
const waitForImages = (element: HTMLElement, timeout = 2000): Promise<void> => {
  return new Promise((resolve) => {
    const images = element.querySelectorAll('img');
    if (images.length === 0) {
      resolve();
      return;
    }

    let loaded = 0;
    const total = images.length;
    const timer = setTimeout(resolve, timeout); // Don't wait forever

    const checkDone = () => {
      loaded++;
      if (loaded >= total) {
        clearTimeout(timer);
        resolve();
      }
    };

    images.forEach(img => {
      if (img.complete) {
        checkDone();
      } else {
        img.addEventListener('load', checkDone, { once: true });
        img.addEventListener('error', checkDone, { once: true });
      }
    });
  });
};

/**
 * Hook for generating thumbnails with reliable capture
 */
export function useThumbnailGenerator() {
  
  const generateThumbnail = useCallback(async ({
    elementId,
    backgroundColor = '#000000',
    pixelRatio = 0.5,
    quality = 0.7,
    width = 1600,
    height = 900,
  }: ThumbnailOptions): Promise<string | null> => {
    
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const element = document.getElementById(elementId);
        if (!element) {
          console.warn(`Thumbnail: Element ${elementId} not found`);
          return null;
        }

        // Wait for paint cycle
        await waitForPaint();
        
        // Wait for images to load (with timeout)
        await waitForImages(element, 2000);
        
        // Additional delay on first attempt to ensure complex layouts are ready
        if (attempt === 1) {
          await new Promise(r => setTimeout(r, 100));
        }

        const dataUrl = await toJpeg(element, {
          cacheBust: true,
          pixelRatio,
          backgroundColor,
          quality,
          width: Math.min(width, element.scrollWidth),
          height: Math.min(height, element.scrollHeight),
          skipAutoScale: true,
          includeQueryParams: true,
        });
        
        // Validate that we got a real image (not empty)
        if (dataUrl && dataUrl.length > 1000) {
          return dataUrl;
        }
        
        // If too small, retry
        console.warn(`Thumbnail attempt ${attempt}: Image too small, retrying...`);
        
      } catch (error) {
        console.warn(`Thumbnail attempt ${attempt} failed:`, error);
      }
      
      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 200 * attempt));
      }
    }
    
    console.error('Thumbnail generation failed after all retries');
    return null;
  }, []);

  return { generateThumbnail };
}
