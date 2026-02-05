import { useState, useEffect } from 'react';

const UNSPLASH_FALLBACK_IMAGES: Record<string, string[]> = {
  beauty: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80',
  ],
  hair: [
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80',
    'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=80',
    'https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=800&q=80',
  ],
  nails: [
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',
    'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&q=80',
    'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=800&q=80',
  ],
  spa: [
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbec14?w=800&q=80',
    'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=80',
  ],
  makeup: [
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&q=80',
    'https://images.unsplash.com/photo-1470259078422-826894b933aa?w=800&q=80',
  ],
};

function extractKeywords(imageIdea: string): string {
  const text = imageIdea.toLowerCase();
  
  // Map Polish beauty terms to categories
  if (text.includes('paznok') || text.includes('manicure') || text.includes('pedicure') || text.includes('nail')) {
    return 'nails';
  }
  if (text.includes('włos') || text.includes('fryzur') || text.includes('hair') || text.includes('strzyż') || text.includes('kolor')) {
    return 'hair';
  }
  if (text.includes('spa') || text.includes('masaż') || text.includes('relaks') || text.includes('wellness')) {
    return 'spa';
  }
  if (text.includes('makijaż') || text.includes('makeup') || text.includes('szmink') || text.includes('kosmetyk')) {
    return 'makeup';
  }
  if (text.includes('beauty') || text.includes('urod') || text.includes('pielęgn') || text.includes('skór') || text.includes('twarz')) {
    return 'beauty';
  }
  
  return 'default';
}

function getRandomImage(category: string, seed?: number): string {
  const images = UNSPLASH_FALLBACK_IMAGES[category] || UNSPLASH_FALLBACK_IMAGES.default;
  const index = seed !== undefined ? seed % images.length : Math.floor(Math.random() * images.length);
  return images[index];
}

export function useUnsplashImage(imageIdea?: string, seed?: number): { imageUrl: string; isLoading: boolean } {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!imageIdea) {
      setImageUrl(getRandomImage('default', seed));
      setIsLoading(false);
      return;
    }

    const category = extractKeywords(imageIdea);
    setImageUrl(getRandomImage(category, seed));
    setIsLoading(false);
  }, [imageIdea, seed]);

  return { imageUrl, isLoading };
}

// Direct function for immediate use
export function getBeautyImage(imageIdea?: string, index?: number): string {
  if (!imageIdea) {
    return getRandomImage('default', index);
  }
  const category = extractKeywords(imageIdea);
  return getRandomImage(category, index);
}
