import { TemplateData } from './FabricCanvas';

export const fabricTemplates: TemplateData[] = [
  // 1. PRZED I PO - Minimalistyczne porównanie
  {
    id: 'before-after',
    name: 'Przed i Po',
    width: 1080,
    height: 1080,
    elements: [
      // Czarne tło
      { type: 'rect', props: { left: 0, top: 0, width: 1080, height: 1080, fill: '#000000' } },
      // Zdjęcie PRZED - lewa strona
      { type: 'image', props: { name: 'beforeImage', left: 0, top: 0, width: 535, height: 1080 } },
      // Zdjęcie PO - prawa strona  
      { type: 'image', props: { name: 'afterImage', left: 545, top: 0, width: 535, height: 1080 } },
      // Złota linia środkowa
      { type: 'rect', props: { left: 537, top: 0, width: 6, height: 1080, fill: '#D4AF37' } },
      // Label PRZED
      { type: 'rect', props: { left: 30, top: 30, width: 120, height: 44, fill: '#000000' } },
      { type: 'text', props: { text: 'PRZED', left: 35, top: 38, width: 110, fontSize: 22, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', textAlign: 'center' } },
      // Label PO
      { type: 'rect', props: { left: 930, top: 30, width: 120, height: 44, fill: '#D4AF37' } },
      { type: 'text', props: { text: 'PO', left: 935, top: 38, width: 110, fontSize: 22, fontFamily: 'Arial', fontWeight: 'bold', fill: '#000000', textAlign: 'center' } },
      // Nazwa zabiegu - dolny pasek
      { type: 'rect', props: { left: 0, top: 980, width: 1080, height: 100, fill: 'rgba(0,0,0,0.85)' } },
      { type: 'text', props: { name: 'treatmentName', text: 'LIFTING TWARZY', left: 40, top: 1005, width: 800, fontSize: 36, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff' } },
      { type: 'text', props: { name: 'salonName', text: '@beautystudio', left: 860, top: 1010, width: 200, fontSize: 24, fontFamily: 'Arial', fill: '#D4AF37', textAlign: 'right' } },
    ],
  },

  // 2. USŁUGA - Elegancka prezentacja z mocnym typograficznym akcentem
  {
    id: 'service',
    name: 'Usługa',
    width: 1080,
    height: 1080,
    elements: [
      // Czarne tło
      { type: 'rect', props: { left: 0, top: 0, width: 1080, height: 1080, fill: '#000000' } },
      // Główne zdjęcie
      { type: 'image', props: { name: 'mainImage', left: 0, top: 0, width: 1080, height: 1080 } },
      // Elegancki gradient overlay od dołu - głębszy
      { type: 'gradient-rect', props: { left: 0, top: 200, width: 1080, height: 880, gradientColors: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)'], gradientDirection: 'vertical' } },
      // Złoty gradient na górze - subtelny
      { type: 'gradient-rect', props: { left: 0, top: 0, width: 1080, height: 150, gradientColors: ['rgba(212,175,55,0.2)', 'rgba(0,0,0,0)'], gradientDirection: 'vertical' } },
      // Dekoracyjna złota linia górna
      { type: 'rect', props: { left: 60, top: 60, width: 80, height: 3, fill: '#D4AF37' } },
      { type: 'rect', props: { left: 940, top: 60, width: 80, height: 3, fill: '#D4AF37' } },
      // Dekoracyjne narożniki
      { type: 'rect', props: { left: 60, top: 60, width: 3, height: 60, fill: '#D4AF37' } },
      { type: 'rect', props: { left: 1017, top: 60, width: 3, height: 60, fill: '#D4AF37' } },
      // Złota linia akcentowa - dłuższa
      { type: 'rect', props: { left: 60, top: 700, width: 180, height: 4, fill: '#D4AF37' } },
      // Nazwa usługi - duża, elegancka typografia
      { type: 'text', props: { name: 'serviceName', text: 'MEZOTERAPIA', left: 60, top: 730, width: 960, fontSize: 84, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#ffffff', letterSpacing: 6 } },
      // Subtelna linia pod tytułem
      { type: 'rect', props: { left: 60, top: 835, width: 400, height: 1, fill: 'rgba(212,175,55,0.5)' } },
      // Opis - elegancki
      { type: 'text', props: { name: 'description', text: 'Odmłodzenie i nawilżenie skóry', left: 60, top: 860, width: 700, fontSize: 26, fontFamily: 'Georgia', fill: '#a8a8a8', fontStyle: 'italic' } },
      // Cena - wyróżniona
      { type: 'text', props: { text: 'od', left: 60, top: 930, width: 40, fontSize: 24, fontFamily: 'Georgia', fill: '#a8a8a8' } },
      { type: 'text', props: { name: 'price', text: '299 zł', left: 105, top: 920, width: 300, fontSize: 48, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#D4AF37' } },
      // Salon - elegancki
      { type: 'rect', props: { left: 800, top: 1000, width: 60, height: 1, fill: '#D4AF37' } },
      { type: 'text', props: { name: 'salonName', text: 'BEAUTY STUDIO', left: 700, top: 1015, width: 320, fontSize: 18, fontFamily: 'Georgia', fill: '#D4AF37', textAlign: 'right', letterSpacing: 4 } },
    ],
  },

  // 3. RABAT - Neonowy róż z mocnym kontrastem
  {
    id: 'discount',
    name: 'Rabat',
    width: 1080,
    height: 1080,
    elements: [
      // Ciemne tło
      { type: 'rect', props: { left: 0, top: 0, width: 1080, height: 1080, fill: '#0a0a0a' } },
      // Różowy gradient w tle - subtelny glow
      { type: 'gradient-rect', props: { left: 0, top: 0, width: 600, height: 1080, gradientColors: ['rgba(255,64,129,0.15)', 'rgba(0,0,0,0)'], gradientDirection: 'horizontal' } },
      // Zdjęcie po prawej - z eleganckim przycięciem
      { type: 'image', props: { name: 'mainImage', left: 400, top: 60, width: 620, height: 960 } },
      // Gradient na zdjęciu od lewej - mocniejszy
      { type: 'gradient-rect', props: { left: 300, top: 0, width: 500, height: 1080, gradientColors: ['#0a0a0a', 'rgba(10,10,10,0.8)', 'rgba(10,10,10,0)'], gradientDirection: 'horizontal' } },
      // Różowe paski dekoracyjne
      { type: 'rect', props: { left: 0, top: 0, width: 6, height: 1080, fill: '#FF4081' } },
      { type: 'rect', props: { left: 0, top: 0, width: 1080, height: 4, fill: '#FF4081' } },
      { type: 'rect', props: { left: 0, top: 1076, width: 1080, height: 4, fill: '#FF4081' } },
      // Duża liczba rabatu - WOW effect
      { type: 'text', props: { name: 'discountValue', text: '-30%', left: 30, top: 200, width: 450, fontSize: 180, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#FF4081' } },
      // Podświetlenie pod rabatem
      { type: 'gradient-rect', props: { left: 30, top: 400, width: 350, height: 20, gradientColors: ['rgba(255,64,129,0.4)', 'rgba(0,0,0,0)'], gradientDirection: 'horizontal' } },
      // Elegancka linia
      { type: 'rect', props: { left: 50, top: 450, width: 100, height: 3, fill: '#FF4081' } },
      // Na co rabat - elegancka typografia
      { type: 'text', props: { name: 'discountOn', text: 'NA ZABIEGI\nPIELĘGNACYJNE', left: 50, top: 500, width: 400, fontSize: 44, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#ffffff', lineHeight: 1.2, letterSpacing: 2 } },
      // Opis dodatkowy
      { type: 'text', props: { text: 'Skorzystaj z wyjątkowej oferty', left: 50, top: 650, width: 350, fontSize: 20, fontFamily: 'Georgia', fill: '#888888', fontStyle: 'italic' } },
      // Termin ważności - elegancki badge
      { type: 'rect', props: { left: 50, top: 730, width: 200, height: 55, fill: 'transparent', stroke: '#FF4081', strokeWidth: 2 } },
      { type: 'text', props: { text: 'WAŻNE DO', left: 60, top: 742, width: 180, fontSize: 12, fontFamily: 'Georgia', fill: '#FF4081', textAlign: 'center', letterSpacing: 3 } },
      { type: 'text', props: { name: 'validUntil', text: '31.12.2024', left: 60, top: 758, width: 180, fontSize: 22, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#ffffff', textAlign: 'center' } },
      // CTA button
      { type: 'rect', props: { left: 50, top: 850, width: 300, height: 70, fill: '#FF4081' } },
      { type: 'text', props: { text: 'UMÓW WIZYTĘ', left: 60, top: 872, width: 280, fontSize: 22, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', letterSpacing: 3 } },
      // Salon
      { type: 'rect', props: { left: 50, top: 980, width: 50, height: 1, fill: '#FF4081' } },
      { type: 'text', props: { name: 'salonName', text: 'BEAUTY STUDIO', left: 110, top: 968, width: 250, fontSize: 16, fontFamily: 'Georgia', fill: '#FF4081', letterSpacing: 4 } },
    ],
  },

  // 4. SALON - Luksusowa prezentacja marki
  {
    id: 'salon',
    name: 'Salon',
    width: 1080,
    height: 1080,
    elements: [
      // Głębokie czarne tło
      { type: 'rect', props: { left: 0, top: 0, width: 1080, height: 1080, fill: '#000000' } },
      // Subtelny złoty gradient w tle
      { type: 'gradient-rect', props: { left: 0, top: 0, width: 1080, height: 1080, gradientColors: ['rgba(212,175,55,0.08)', 'rgba(0,0,0,0)', 'rgba(212,175,55,0.05)'], gradientDirection: 'diagonal' } },
      // Zewnętrzna złota ramka
      { type: 'rect', props: { left: 40, top: 40, width: 1000, height: 1000, fill: 'transparent', stroke: '#D4AF37', strokeWidth: 2 } },
      // Wewnętrzna subtelna ramka
      { type: 'rect', props: { left: 55, top: 55, width: 970, height: 970, fill: 'transparent', stroke: '#D4AF37', strokeWidth: 1, opacity: 0.3 } },
      // Dekoracyjne narożniki - góra lewa
      { type: 'rect', props: { left: 40, top: 40, width: 100, height: 4, fill: '#D4AF37' } },
      { type: 'rect', props: { left: 40, top: 40, width: 4, height: 100, fill: '#D4AF37' } },
      // Góra prawa
      { type: 'rect', props: { left: 940, top: 40, width: 100, height: 4, fill: '#D4AF37' } },
      { type: 'rect', props: { left: 1036, top: 40, width: 4, height: 100, fill: '#D4AF37' } },
      // Dół lewa
      { type: 'rect', props: { left: 40, top: 1036, width: 100, height: 4, fill: '#D4AF37' } },
      { type: 'rect', props: { left: 40, top: 940, width: 4, height: 100, fill: '#D4AF37' } },
      // Dół prawa
      { type: 'rect', props: { left: 940, top: 1036, width: 100, height: 4, fill: '#D4AF37' } },
      { type: 'rect', props: { left: 1036, top: 940, width: 4, height: 100, fill: '#D4AF37' } },
      // Zdjęcie w środku - z ramką
      { type: 'rect', props: { left: 100, top: 120, width: 880, height: 480, fill: 'transparent', stroke: '#D4AF37', strokeWidth: 1 } },
      { type: 'image', props: { name: 'mainImage', left: 105, top: 125, width: 870, height: 470 } },
      // Dekoracyjna linia przed nazwą
      { type: 'rect', props: { left: 440, top: 650, width: 200, height: 1, fill: '#D4AF37' } },
      { type: 'circle', props: { left: 530, top: 643, radius: 8, fill: 'transparent', stroke: '#D4AF37', strokeWidth: 1 } },
      // Nazwa salonu - elegancka typografia
      { type: 'text', props: { name: 'salonName', text: 'BEAUTY\nSTUDIO', left: 100, top: 700, width: 880, fontSize: 110, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', lineHeight: 1.0, letterSpacing: 10 } },
      // Dekoracyjna linia pod nazwą
      { type: 'rect', props: { left: 380, top: 935, width: 320, height: 1, fill: '#D4AF37' } },
      // Tagline - elegancki
      { type: 'text', props: { name: 'tagline', text: 'Twoja metamorfoza zaczyna się tutaj', left: 100, top: 965, width: 880, fontSize: 24, fontFamily: 'Georgia', fill: '#D4AF37', textAlign: 'center', fontStyle: 'italic' } },
    ],
  },

  // 5. OFERTA LIMITOWANA - Elegancka z urgency i złotymi akcentami
  {
    id: 'limited-offer',
    name: 'Oferta Limitowana',
    width: 1080,
    height: 1080,
    elements: [
      // Czarne tło
      { type: 'rect', props: { left: 0, top: 0, width: 1080, height: 1080, fill: '#000000' } },
      // Złoty gradient w tle - subtelny luxury
      { type: 'gradient-rect', props: { left: 0, top: 0, width: 1080, height: 1080, gradientColors: ['rgba(212,175,55,0.1)', 'rgba(0,0,0,0)', 'rgba(212,175,55,0.05)'], gradientDirection: 'diagonal' } },
      // Zdjęcie po prawej stronie
      { type: 'image', props: { name: 'mainImage', left: 480, top: 0, width: 600, height: 1080 } },
      // Elegancki gradient na zdjęciu od lewej
      { type: 'gradient-rect', props: { left: 380, top: 0, width: 400, height: 1080, gradientColors: ['#000000', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0)'], gradientDirection: 'horizontal' } },
      // Złote ramki dekoracyjne
      { type: 'rect', props: { left: 0, top: 0, width: 5, height: 1080, fill: '#D4AF37' } },
      { type: 'rect', props: { left: 1075, top: 0, width: 5, height: 1080, fill: '#D4AF37' } },
      { type: 'rect', props: { left: 0, top: 0, width: 1080, height: 3, fill: '#D4AF37' } },
      { type: 'rect', props: { left: 0, top: 1077, width: 1080, height: 3, fill: '#D4AF37' } },
      // Badge "TYLKO TERAZ" - elegancki
      { type: 'rect', props: { left: 50, top: 60, width: 200, height: 50, fill: '#D4AF37' } },
      { type: 'rect', props: { left: 55, top: 65, width: 190, height: 40, fill: 'transparent', stroke: '#000000', strokeWidth: 1 } },
      { type: 'text', props: { text: 'TYLKO TERAZ', left: 55, top: 73, width: 190, fontSize: 18, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#000000', textAlign: 'center', letterSpacing: 3 } },
      // Dekoracyjna linia
      { type: 'rect', props: { left: 50, top: 150, width: 100, height: 3, fill: '#D4AF37' } },
      // Nazwa oferty - mocna typografia
      { type: 'text', props: { name: 'offerName', text: 'MAKIJAŻ\nPERMANENTNY', left: 50, top: 190, width: 420, fontSize: 72, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#ffffff', lineHeight: 1.0, letterSpacing: 4 } },
      // Subtelna linia
      { type: 'rect', props: { left: 50, top: 400, width: 350, height: 1, fill: 'rgba(212,175,55,0.5)' } },
      // Stara cena przekreślona
      { type: 'text', props: { name: 'oldPrice', text: '799 zł', left: 50, top: 440, width: 180, fontSize: 32, fontFamily: 'Georgia', fill: '#555555', textDecoration: 'line-through' } },
      // Nowa cena - wyróżniona
      { type: 'text', props: { name: 'newPrice', text: '499 zł', left: 50, top: 490, width: 380, fontSize: 72, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#D4AF37' } },
      // Opis
      { type: 'text', props: { name: 'description', text: 'Brwi, usta lub kreski', left: 50, top: 590, width: 400, fontSize: 24, fontFamily: 'Georgia', fill: '#888888', fontStyle: 'italic' } },
      // Elegancki CTA
      { type: 'rect', props: { left: 50, top: 680, width: 320, height: 65, fill: '#D4AF37' } },
      { type: 'rect', props: { left: 55, top: 685, width: 310, height: 55, fill: 'transparent', stroke: '#000000', strokeWidth: 1 } },
      { type: 'text', props: { name: 'cta', text: 'UMÓW WIZYTĘ', left: 55, top: 700, width: 310, fontSize: 22, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#000000', textAlign: 'center', letterSpacing: 3 } },
      // Informacja o ograniczeniu
      { type: 'text', props: { text: 'Ilość miejsc ograniczona', left: 50, top: 780, width: 320, fontSize: 16, fontFamily: 'Georgia', fill: '#666666', textAlign: 'center', fontStyle: 'italic' } },
      // Salon - elegancki
      { type: 'rect', props: { left: 50, top: 980, width: 60, height: 1, fill: '#D4AF37' } },
      { type: 'text', props: { name: 'salonName', text: 'BEAUTY STUDIO', left: 120, top: 968, width: 280, fontSize: 16, fontFamily: 'Georgia', fill: '#D4AF37', letterSpacing: 4 } },
    ],
  },
];

export const getTemplateById = (id: string): TemplateData | undefined => {
  return fabricTemplates.find(t => t.id === id);
};
