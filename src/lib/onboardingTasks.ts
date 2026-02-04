// Default onboarding tasks template for new clients
export const DEFAULT_ONBOARDING_TASKS = [
  {
    title: 'Zebranie dostępów do kont reklamowych',
    description: 'Uzyskaj dostęp do Business Manager, konta reklamowego FB/IG, Google Analytics',
    priority: 'high',
  },
  {
    title: 'Analiza dotychczasowych działań',
    description: 'Przeanalizuj historię konta reklamowego, poprzednie kampanie i wyniki',
    priority: 'high',
  },
  {
    title: 'Brief z klientem',
    description: 'Przeprowadź rozmowę o celach, grupie docelowej, USP i konkurencji',
    priority: 'high',
  },
  {
    title: 'Audyt profili social media',
    description: 'Sprawdź Instagram i Facebook - spójność wizualna, jakość postów, regularność',
    priority: 'medium',
  },
  {
    title: 'Zebranie materiałów graficznych',
    description: 'Poproś o zdjęcia przed/po, portfolio prac, logotypy, zdjęcia salonu',
    priority: 'medium',
  },
  {
    title: 'Konfiguracja Pixela i konwersji',
    description: 'Zainstaluj/sprawdź Pixel na stronie, skonfiguruj zdarzenia i konwersje',
    priority: 'high',
  },
  {
    title: 'Przygotowanie strategii kampanii',
    description: 'Opracuj plan kampanii: cele, grupy docelowe, budżety, harmonogram',
    priority: 'high',
  },
  {
    title: 'Stworzenie pierwszych kreacji',
    description: 'Przygotuj grafiki/wideo do pierwszej kampanii testowej',
    priority: 'medium',
  },
  {
    title: 'Uruchomienie kampanii testowej',
    description: 'Wystartuj pierwszą kampanię z małym budżetem do optymalizacji',
    priority: 'medium',
  },
  {
    title: 'Ustalenie harmonogramu raportowania',
    description: 'Określ częstotliwość i format raportów (tygodniowe/miesięczne)',
    priority: 'low',
  },
];

export interface OnboardingTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}
