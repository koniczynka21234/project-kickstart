import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mail, Phone, MessageSquare, FileSignature, CheckCircle2,
  AlertCircle, Lightbulb, Target, Heart, Clock,
  Users, TrendingUp, Shield, Star, XCircle,
  ChevronDown, ChevronUp, ArrowRight, Sparkles,
  ClipboardCheck, BookOpen, Play, Lock,
  FileText, Mic, ListChecks, Eye, MessageCircle,
  Quote, HelpCircle, Zap
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ==================== CONVERSATION SCRIPT DATA ====================
// Each audit section has a full conversation script with literal text

interface ScriptSection {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  priority: "high" | "medium" | "low";
  opening: string;
  talkingPoints: {
    topic: string;
    whatToSay: string;
    question: string;
    ifResistance: string;
  }[];
  transition: string;
  closingArgument: string;
}

interface AuditScript {
  id: string;
  clientName: string;
  auditDate: string;
  status: "ready" | "draft";
  intro: {
    greeting: string;
    iceBreaker: string;
    agendaSetup: string;
  };
  sections: ScriptSection[];
  closing: {
    summary: string;
    nextSteps: string;
    urgency: string;
  };
}

export const mockAuditScripts: AuditScript[] = [
  {
    id: "demo-1",
    clientName: "Studio Urody Bella",
    auditDate: "2025-02-20",
    status: "ready",
    intro: {
      greeting: "Dzień dobry Pani [Imię], tu [Twoje imię] z Aurine. Dziękuję za poświęcony czas na tę rozmowę.",
      iceBreaker: "Widziałem, że ostatnio dodaliście nową usługę — jak idzie zainteresowanie?",
      agendaSetup: "Przygotowałem szczegółową analizę Państwa obecności online. Chciałbym przejść przez najważniejsze punkty i pokazać, gdzie widzę największy potencjał wzrostu. Zajmie nam to ok. 20-25 minut. Zaczynamy?"
    },
    sections: [
      {
        id: "fb",
        name: "Profil Facebook",
        score: 3,
        maxScore: 10,
        priority: "high",
        opening: "Zacznijmy od Facebooka, bo tutaj widzę kilka rzeczy, które można szybko poprawić i od razu zobaczyć efekty.",
        talkingPoints: [
          {
            topic: "Zdjęcie profilowe i okładka",
            whatToSay: "Zauważyłem, że zdjęcie profilowe jest słabej jakości i okładka nie była zmieniana od dłuższego czasu. To pierwsze co widzi potencjalna klientka — musi wyglądać profesjonalnie i zachęcająco. Porównajmy to z tym, jak wyglądają najlepsze salony w branży.",
            question: "Czy macie profesjonalne zdjęcia salonu, które moglibyśmy wykorzystać?",
            ifResistance: "Rozumiem, że to może się wydawać drobnostka. Ale statystyki pokazują, że profile z profesjonalnymi zdjęciami mają 40% więcej kliknięć. To dosłownie pierwsza rzecz, która decyduje czy ktoś kliknie dalej."
          },
          {
            topic: "Informacje o firmie",
            whatToSay: "Brakuje kilku kluczowych informacji — godziny otwarcia nie są aktualne, nie ma linku do rezerwacji online, a opis jest bardzo ogólnikowy. Klientka, która Was znajdzie, nie wie nawet czy jesteście otwarci.",
            question: "Czy korzystacie z jakiegoś systemu rezerwacji online?",
            ifResistance: "To dosłownie 15 minut pracy, a każdego dnia tracicie potencjalne klientki, które nie mogą Was łatwo znaleźć lub umówić się na wizytę."
          },
          {
            topic: "Regularność postów",
            whatToSay: "Ostatni post był 3 tygodnie temu. Algorytm Facebooka wymaga regularności — minimum 3 posty tygodniowo, żeby utrzymać zasięgi. Bez tego Wasze treści po prostu nie docierają do ludzi.",
            question: "Kto u Was zajmuje się prowadzeniem social media?",
            ifResistance: "Wiem, że to wymaga czasu. Właśnie dlatego agencje jak nasza istnieją — przejmujemy ten ciężar, żebyście mogli skupić się na pracy z klientkami."
          }
        ],
        transition: "To tyle jeśli chodzi o Facebooka. Przejdźmy teraz do Instagrama, bo tam jest podobna sytuacja.",
        closingArgument: "Podsumowując Facebook — z wynikiem 3/10 tracicie codziennie potencjalne klientki. Ale dobra wiadomość jest taka, że te zmiany można wprowadzić stosunkowo szybko."
      },
      {
        id: "ig",
        name: "Profil Instagram",
        score: 5,
        maxScore: 10,
        priority: "medium",
        opening: "Instagram wygląda trochę lepiej niż Facebook, ale wciąż jest sporo do poprawy.",
        talkingPoints: [
          {
            topic: "Estetyka feedu",
            whatToSay: "Feed nie ma spójnej estetyki. Zdjęcia są różnej jakości, nie ma jednolitego stylu. Na Instagramie w branży beauty to absolutna podstawa — klientki oceniają salon po tym, jak wygląda Wasz profil.",
            question: "Czy robicie zdjęcia swoich prac? Metamorfozy, efekty zabiegów?",
            ifResistance: "Pokażę Wam profile salonów podobnej wielkości, które robią to dobrze — zobaczycie różnicę w zaangażowaniu. To nie musi być skomplikowane."
          },
          {
            topic: "Stories i Reels",
            whatToSay: "Nie widzę aktywności w Stories ani Reels. W tej chwili Reels to najlepszy sposób na dotarcie do nowych osób — algorytm promuje je dużo mocniej niż zwykłe posty.",
            question: "Czy próbowaliście nagrywać krótkie filmiki z zabiegów?",
            ifResistance: "Nie muszą być idealne — autentyczne, krótkie klipy z salonu często działają lepiej niż profesjonalne produkcje. 15-30 sekund wystarczy."
          }
        ],
        transition: "Dobrze, przejdźmy do Google Moja Firma, bo tam jest naprawdę krytyczna sytuacja.",
        closingArgument: "Instagram z wynikiem 5/10 — jest fundament, ale brakuje strategii i regularności."
      },
      {
        id: "gmb",
        name: "Google Moja Firma",
        score: 2,
        maxScore: 10,
        priority: "high",
        opening: "To jest chyba najbardziej zaniedbany obszar, a jednocześnie najważniejszy jeśli chodzi o pozyskiwanie lokalnych klientek.",
        talkingPoints: [
          {
            topic: "Wizytówka Google",
            whatToSay: "Wizytówka jest praktycznie pusta — brakuje zdjęć, opisu usług, godzin otwarcia. Gdy ktoś wpisze 'salon kosmetyczny [miasto]' w Google, Wasza wizytówka wygląda nieaktywnie. A to właśnie tam szuka Was 70% nowych klientek.",
            question: "Czy wiecie, ile osób miesięcznie wyświetla Waszą wizytówkę Google?",
            ifResistance: "Pokażę Wam statystyki — salony z uzupełnioną wizytówką dostają średnio 5x więcej zapytań. To są dosłownie klientki, które chcą się umówić."
          },
          {
            topic: "Opinie",
            whatToSay: "Macie tylko 8 opinii, a średnia to 4.2. Dla porównania — Wasi konkurenci mają po 50-100 opinii ze średnią 4.8. To bezpośrednio wpływa na to, czy ktoś wybierze Was czy konkurencję.",
            question: "Czy prosicie klientki o wystawienie opinii po wizycie?",
            ifResistance: "Wystarczy prosty system — QR kod na recepcji lub SMS po wizycie. My możemy to dla Was ustawić."
          }
        ],
        transition: "OK, teraz popatrzmy na stronę internetową.",
        closingArgument: "Google Moja Firma to 2/10 — to jest pożar, który trzeba ugasić jako pierwszy, bo tracimy klientki, które aktywnie Was szukają."
      },
      {
        id: "www",
        name: "Strona WWW",
        score: 7,
        maxScore: 10,
        priority: "low",
        opening: "Strona internetowa to Wasz najsilniejszy punkt — wygląda dobrze, ale jest kilka rzeczy do poprawy.",
        talkingPoints: [
          {
            topic: "Szybkość ładowania",
            whatToSay: "Strona ładuje się trochę za wolno na mobile — ponad 4 sekundy. Google bierze to pod uwagę przy pozycjonowaniu, a klientki po prostu zamykają stronę, która nie chce się załadować.",
            question: "Kto zajmuje się technicznie Waszą stroną?",
            ifResistance: "To kwestia optymalizacji zdjęć i kilku technicznych poprawek — nic drastycznego."
          }
        ],
        transition: "Na koniec porozmawiajmy o reklamach płatnych.",
        closingArgument: "Strona 7/10 — solidna baza, wymaga drobnych korekt."
      },
      {
        id: "ads",
        name: "Reklamy płatne",
        score: 1,
        maxScore: 10,
        priority: "high",
        opening: "I tu dochodzimy do reklam — a właściwie ich braku, bo widzę, że praktycznie nie prowadzicie żadnych kampanii.",
        talkingPoints: [
          {
            topic: "Brak aktywnych kampanii",
            whatToSay: "W tej chwili nie macie żadnych aktywnych kampanii reklamowych na Facebooku ani Instagramie. To znaczy, że jesteście całkowicie zależni od organicznych zasięgów, które rok do roku spadają. Bez reklam docieracie może do 5-10% swoich obserwujących.",
            question: "Czy kiedykolwiek próbowaliście uruchomić reklamy na Facebooku?",
            ifResistance: "Rozumiem obawy. Ale chodzi o precyzyjne targetowanie — pokazujemy reklamy kobietom w promieniu 10km od salonu, które interesują się urodą. To nie jest 'wyrzucanie pieniędzy' — to inwestycja z mierzalnym zwrotem."
          },
          {
            topic: "Budżet i ROI",
            whatToSay: "Przy budżecie 1000-1500 zł miesięcznie możemy generować 30-50 zapytań o wizytę. Przy średniej wartości klientki to zwrot 5-8x. Mogę pokazać Wam dokładne wyliczenia.",
            question: "Jaka jest średnia wartość wizyty u Was?",
            ifResistance: "Zaczniemy od małego budżetu testowego — 500 zł na 2 tygodnie, żebyście zobaczyli efekty. Jeśli nie zadziała, nic nie tracicie."
          }
        ],
        transition: "",
        closingArgument: "Reklamy 1/10 — to jest Wasz największy niewykorzystany potencjał. Konkurencja już to robi."
      },
      {
        id: "content",
        name: "Content & Branding",
        score: 4,
        maxScore: 10,
        priority: "medium",
        opening: "Ostatnia rzecz — ogólny content i wizerunek marki online.",
        talkingPoints: [
          {
            topic: "Spójność wizualna",
            whatToSay: "Brakuje spójnej identyfikacji wizualnej w social media. Posty nie mają jednolitego stylu, nie ma szablonów graficznych. Profesjonalny wygląd buduje zaufanie — klientki widzą, że dbajcie o szczegóły.",
            question: "Czy macie księgę znaku lub wytyczne dotyczące kolorów i fontów?",
            ifResistance: "My tworzymy szablony graficzne dla naszych klientów — dzięki temu każdy post wygląda profesjonalnie bez dodatkowej pracy z Waszej strony."
          }
        ],
        transition: "",
        closingArgument: "Content 4/10 — brakuje strategii i spójności, ale potencjał jest duży."
      }
    ],
    closing: {
      summary: "Podsumowując — Wasz łączny wynik to 22/60. Największe problemy to Google Moja Firma, reklamy i Facebook. Dobra wiadomość jest taka, że każdy z tych obszarów da się znacząco poprawić w ciągu pierwszych 30 dni współpracy.",
      nextSteps: "Proponuję następny krok — przygotujemy dla Państwa spersonalizowaną ofertę, która dokładnie pokazuje co robimy w każdym z tych obszarów i jakich efektów mogą się Państwo spodziewać. Mogę ją przesłać jeszcze dziś.",
      urgency: "Każdy dzień bez działania to utracone klientki. Wasza konkurencja w [mieście] już prowadzi kampanie i zbiera opinie — im dłużej czekacie, tym trudniej będzie nadrobić."
    }
  },
  {
    id: "demo-2",
    clientName: "Salon Glamour",
    auditDate: "2025-02-18",
    status: "ready",
    intro: {
      greeting: "Dzień dobry Pani [Imię], tu [Twoje imię] z Aurine. Cieszę się, że znalazła Pani czas na rozmowę.",
      iceBreaker: "Widziałem Wasze metamorfozy na Instagramie — świetna robota z koloryzacjami!",
      agendaSetup: "Przygotowałem analizę Waszej obecności online — przejdźmy przez najważniejsze punkty. Zajmie to ok. 20 minut."
    },
    sections: [
      {
        id: "fb",
        name: "Profil Facebook",
        score: 6,
        maxScore: 10,
        priority: "medium",
        opening: "Facebook wygląda nieźle — macie solidną bazę, ale kilka rzeczy wymaga dopracowania.",
        talkingPoints: [
          {
            topic: "Zaangażowanie w postach",
            whatToSay: "Posty mają mało reakcji i komentarzy — średnio 5-10 na post. Z Waszą bazą fanów powinniście mieć 3-4x więcej. To kwestia formatu postów i godzin publikacji.",
            question: "O której godzinie zazwyczaj publikujecie posty?",
            ifResistance: "Zmiana formatu postów to prosta rzecz — pokażę Wam przykłady, które generują 10x więcej komentarzy."
          }
        ],
        transition: "Instagram wygląda lepiej, ale popatrzmy na szczegóły.",
        closingArgument: "Facebook 6/10 — dobra baza, ale zasięgi i zaangażowanie wymagają pracy."
      },
      {
        id: "gmb",
        name: "Google Moja Firma",
        score: 3,
        maxScore: 10,
        priority: "high",
        opening: "Google Moja Firma to Wasz największy problem — tracimy tutaj klientki, które aktywnie Was szukają.",
        talkingPoints: [
          {
            topic: "Niekompletna wizytówka",
            whatToSay: "Wizytówka jest kompletna tylko w 40%. Brakuje zdjęć wnętrza, listy usług, a godziny otwarcia nie są zaktualizowane. Klientka, która Was znajdzie w Google, nie ma pewności czy jesteście otwarci.",
            question: "Czy wiecie, że 46% wszystkich wyszukiwań Google to zapytania lokalne?",
            ifResistance: "Uzupełnienie wizytówki to 2 godziny pracy raz, a efekty trwają latami."
          }
        ],
        transition: "Przejdźmy do reklam.",
        closingArgument: "Google 3/10 — priorytet numer jeden."
      },
      {
        id: "ads",
        name: "Reklamy płatne",
        score: 2,
        maxScore: 10,
        priority: "high",
        opening: "Reklamy — widzę, że próbowaliście coś uruchomić, ale bez strategii.",
        talkingPoints: [
          {
            topic: "Nieskuteczne kampanie",
            whatToSay: "Była jedna kampania 3 miesiące temu, ale targetowanie było zbyt szerokie — cała Polska zamiast okolicy. Budżet się spalił bez efektu. To częsty błąd — bez doświadczenia łatwo wyrzucić pieniądze.",
            question: "Ile wydaliście na tę kampanię i jakie były efekty?",
            ifResistance: "Rozumiem niechęć po złych doświadczeniach. Ale to jak powiedzieć 'jedzenie nie działa' bo raz poszliście do złej restauracji. Z właściwą strategią, reklamy to najszybszy sposób na nowe klientki."
          }
        ],
        transition: "",
        closingArgument: "Reklamy 2/10 — ogromny potencjał, ale wymaga profesjonalnego podejścia."
      }
    ],
    closing: {
      summary: "Łączny wynik to 30/60. Główne priorytety to Google i reklamy — tam jest najszybszy zwrot z inwestycji.",
      nextSteps: "Przygotuję ofertę skupioną na tych dwóch obszarach — mogę ją przesłać jutro rano.",
      urgency: "Wasze metamorfozy są świetne — szkoda, że tak mało osób je widzi. Z odpowiednią strategią, te same zdjęcia mogą przyciągać dziesiątki nowych klientek."
    }
  }
];

// ==================== KNOWLEDGE BASE DATA ====================
const processSteps = [
  {
    id: 1, title: "Cold Mail + Prezentacja", icon: Mail, timing: "Dzień 1",
    description: "Pierwszy kontakt z potencjalnym klientem",
    details: ["Personalizacja — użyj nazwy salonu i miasta", "Krótka wiadomość (max 150 słów)", "Załącz prezentację PDF", "Jeden jasny CTA"],
    tips: ["Wysyłaj wt-czw 9-11 lub 14-16", "Sprawdź profil salonu przed wysłaniem"],
    donts: ["Nie wysyłaj bez prezentacji", "Nie pisz długich elaboratów"]
  },
  {
    id: 2, title: "SMS Follow-up", icon: MessageSquare, timing: "Dzień 3",
    description: "Celowy trigger 2 dni po cold mailu",
    details: ["SMS 2 dni po cold mailu", "Max 160 znaków", "Nawiąż do maila z prezentacją"],
    tips: ["Wysyłaj w godzinach pracy salonu (10-17)", "Jeden SMS wystarczy"],
    donts: ["Nie wysyłaj wieczorem", "Nie dzwoń bez uprzedzenia"]
  },
  {
    id: 3, title: "Follow-up Email", icon: Clock, timing: "Dzień 6-7",
    description: "Przypomnienie z nową wartością",
    details: ["Nawiąż do poprzedniej wiadomości", "Dodaj case study lub statystykę", "Max 80 słów"],
    tips: ["Bądź pomocny, nie nachalny", "Nawiąż do ich social media"],
    donts: ["Nie przepraszaj za 'nachodzenie'", "Nie powtarzaj treści"]
  },
  {
    id: 4, title: "Rozmowa telefoniczna", icon: Phone, timing: "Gdy odpowie",
    description: "Kluczowy moment sprzedaży",
    details: ["Sprawdź ponownie profil salonu", "Zacznij od pytań", "Słuchaj 70/30", "Ustal następny krok"],
    tips: ["Dzwoń stojąc", "Najlepsze godziny: 10-12, 14-16"],
    donts: ["Nie recytuj skryptu", "Nie kończ bez następnego kroku"]
  },
  {
    id: 5, title: "Negocjacje i Oferta", icon: Target, timing: "Po rozmowie",
    description: "Dopasowanie oferty do potrzeb",
    details: ["Spersonalizowana oferta", "2-3 opcje cenowe", "Case studies podobnych salonów"],
    tips: ["Wyślij ofertę tego samego dnia", "Przygotuj odpowiedzi na obiekcje"],
    donts: ["Nie dawaj zbyt dużo czasu", "Nie obniżaj ceny bez uzasadnienia"]
  },
  {
    id: 6, title: "Umowa i Onboarding", icon: FileSignature, timing: "Finał",
    description: "Finalizacja i start współpracy",
    details: ["Wyślij umowę natychmiast", "Ustal datę startu kampanii", "Wyślij Welcome Pack"],
    tips: ["Deadline na podpisanie — max 3 dni", "Zaplanuj pierwszy raport"],
    donts: ["Nie zostawiaj na tydzień", "Nie zaczynaj bez podpisanej umowy"]
  }
];

const objectionHandling = [
  {
    objection: "To za drogo", icon: "💰", category: "Cena",
    responses: [
      { response: "Rozumiem. Policzmy — ile kosztuje Was pozyskanie jednego klienta? Nasi klienci płacą średnio 15-25 zł za rezerwację.", technique: "Porównanie kosztów" },
      { response: "Ile kosztuje puste miejsce w grafiku? Bo właśnie to możemy wypełnić.", technique: "Koszt alternatywny" }
    ]
  },
  {
    objection: "Muszę się zastanowić", icon: "🤔", category: "Odkładanie",
    responses: [
      { response: "Nad czym konkretnie? Może mogę pomóc odpowiedzieć na wątpliwości teraz.", technique: "Konkretyzacja" },
      { response: "Co musiałoby się wydarzyć, żebyście byli pewni?", technique: "Identyfikacja bariery" }
    ]
  },
  {
    objection: "Nie mam czasu na marketing", icon: "⏰", category: "Czas",
    responses: [
      { response: "Właśnie dlatego istniejemy! Potrzebujemy od Was tylko 30 minut na start.", technique: "Odwrócenie" },
      { response: "Ile czasu poświęcacie na posty, które nie działają?", technique: "Porównanie" }
    ]
  },
  {
    objection: "Reklamy nie działają", icon: "📱", category: "Sceptycyzm",
    responses: [
      { response: "Czy kampanię prowadziła agencja specjalizująca się w beauty?", technique: "Specjalizacja" },
      { response: "Mogę pokazać wyniki z podobnych salonów.", technique: "Dowód społeczny" }
    ]
  },
  {
    objection: "Mam już kogoś", icon: "👥", category: "Konkurencja",
    responses: [
      { response: "Jakie wyniki osiągacie? Chętnie porównamy.", technique: "Wyzwanie" },
      { response: "Gdyby nie przynosiło efektów — możemy wrócić do rozmowy?", technique: "Otwarte drzwi" }
    ]
  },
  {
    objection: "Muszę porozmawiać z partnerem", icon: "👫", category: "Odkładanie",
    responses: [
      { response: "Może umówmy się na rozmowę we trójkę?", technique: "Wspólne spotkanie" },
      { response: "Co będzie dla niego najważniejsze? Przygotuję info.", technique: "Przygotowanie" }
    ]
  }
];

const goldenRules = [
  { icon: Heart, title: "Bądź autentyczny", tip: "Klienci wyczuwają sztuczność." },
  { icon: Users, title: "Słuchaj 70/30", tip: "Klient mówi więcej niż Ty." },
  { icon: Lightbulb, title: "Rozwiązuj problemy", tip: "Oferuj rozwiązanie, nie usługę." },
  { icon: TrendingUp, title: "Mów o wynikach", tip: "Konkretne liczby > ogólne obietnice." },
  { icon: Shield, title: "Buduj zaufanie", tip: "Szczerość wygrywa." },
  { icon: Star, title: "Follow-up", tip: "80% sprzedaży wymaga 5+ kontaktów." },
];

// ==================== HELPERS ====================
const getPriorityColor = (p: string) => {
  if (p === "high") return "text-red-400 bg-red-500/15 border-red-500/30";
  if (p === "medium") return "text-amber-400 bg-amber-500/15 border-amber-500/30";
  return "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
};
const getPriorityLabel = (p: string) => p === "high" ? "Krytyczny" : p === "medium" ? "Do poprawy" : "OK";

const getScoreColor = (score: number, max: number) => {
  const pct = score / max;
  if (pct <= 0.3) return "bg-red-500";
  if (pct <= 0.6) return "bg-amber-500";
  return "bg-emerald-500";
};

// ==================== COMPONENT ====================
export default function ClientService() {
  const [expandedScript, setExpandedScript] = useState<string | null>("demo-1");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [activeKBTab, setActiveKBTab] = useState<"process" | "objections" | "rules">("process");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const navigate = useNavigate();

  const toggleSection = (scriptId: string, sectionId: string) => {
    const key = `${scriptId}-${sectionId}`;
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const totalScore = (sections: ScriptSection[]) => sections.reduce((s, sec) => s + sec.score, 0);
  const totalMax = (sections: ScriptSection[]) => sections.reduce((s, sec) => s + sec.maxScore, 0);

  return (
    <AppLayout>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="w-full max-w-full overflow-hidden">
          {/* HEADER */}
          <div className="border-b border-border/50 bg-card">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center shadow-lg shadow-primary/25">
                  <Mic className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Obsługa Klienta</h1>
                  <p className="text-sm text-muted-foreground">Schematy rozmów audytowych & baza wiedzy</p>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT — side by side */}
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col xl:flex-row gap-6">

              {/* ============ LEFT: CONVERSATION SCRIPTS (prominent) ============ */}
              <div className="flex-1 xl:flex-[2] min-w-0">
                <div className="mb-6"></div>
                <div id="schematy-rozmowy" className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Schematy rozmów</h2>
                    <p className="text-xs text-muted-foreground">Dosłowne skrypty na bazie audytu — sekcja po sekcji</p>
                  </div>
                  <Badge className="bg-primary/15 text-primary border-primary/30 ml-auto hidden sm:flex">
                    {mockAuditScripts.length} skrypty
                  </Badge>
                </div>

                <div className="space-y-4">
                  {mockAuditScripts.map((script) => {
                    const isExpanded = expandedScript === script.id;
                    const score = totalScore(script.sections);
                    const max = totalMax(script.sections);
                    const pct = Math.round((score / max) * 100);
                    const highCount = script.sections.filter(s => s.priority === "high").length;

                    return (
                      <div
                        key={script.id}
                        className={`rounded-2xl border-2 transition-all ${
                          isExpanded
                            ? "border-primary/50 shadow-xl shadow-primary/10 bg-card"
                            : "border-border/40 bg-card hover:border-border/70"
                        }`}
                      >
                        {/* Script header */}
                        <button
                          onClick={() => setExpandedScript(isExpanded ? null : script.id)}
                          className="w-full text-left p-4 sm:p-5 flex items-center gap-4"
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                            isExpanded
                              ? "bg-gradient-to-br from-primary to-pink-600"
                              : "bg-muted"
                          }`}>
                            <Mic className={`w-6 h-6 ${isExpanded ? "text-primary-foreground" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-bold text-foreground text-lg">{script.clientName}</h3>
                              <Badge variant="outline" className="text-[10px]">{script.auditDate}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-muted-foreground">
                                Wynik: <span className="font-semibold text-foreground">{score}/{max}</span> ({pct}%)
                              </span>
                              {highCount > 0 && (
                                <span className="text-red-400 flex items-center gap-1 text-xs">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  {highCount} krytycznych
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                          </div>
                        </button>

                        {/* EXPANDED: full conversation script */}
                        {isExpanded && (
                          <div className="border-t border-border/40">
                            {/* ── INTRO ── */}
                            <div className="p-4 sm:p-6 bg-primary/[0.03] border-b border-border/30">
                              <div className="flex items-center gap-2 mb-4">
                                <Play className="w-4 h-4 text-primary" />
                                <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Otwarcie rozmowy</h4>
                              </div>
                              <div className="space-y-3">
                                <div className="flex gap-3">
                                  <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-[10px] font-bold text-primary">1</span>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Powitanie</p>
                                    <p className="text-sm text-foreground bg-muted/30 p-3 rounded-xl border border-border/30 italic leading-relaxed">
                                      "{script.intro.greeting}"
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-3">
                                  <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-[10px] font-bold text-primary">2</span>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Ice Breaker</p>
                                    <p className="text-sm text-foreground bg-muted/30 p-3 rounded-xl border border-border/30 italic leading-relaxed">
                                      "{script.intro.iceBreaker}"
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-3">
                                  <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-[10px] font-bold text-primary">3</span>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Ustalenie agendy</p>
                                    <p className="text-sm text-foreground bg-muted/30 p-3 rounded-xl border border-border/30 italic leading-relaxed">
                                      "{script.intro.agendaSetup}"
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* ── SECTIONS ── */}
                            <div className="p-4 sm:p-6 space-y-3">
                              <div className="flex items-center gap-2 mb-2">
                                <ListChecks className="w-4 h-4 text-primary" />
                                <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Sekcje audytu — omów po kolei</h4>
                              </div>

                              {script.sections
                                .sort((a, b) => {
                                  const order = { high: 0, medium: 1, low: 2 };
                                  return order[a.priority] - order[b.priority];
                                })
                                .map((section, idx) => {
                                  const sKey = `${script.id}-${section.id}`;
                                  const isOpen = expandedSections[sKey];

                                  return (
                                    <div key={section.id} className={`rounded-xl border transition-all ${
                                      isOpen
                                        ? "border-primary/30 bg-primary/[0.02] shadow-sm"
                                        : "border-border/40 bg-card hover:border-border/60"
                                    }`}>
                                      {/* Section header */}
                                      <button
                                        onClick={() => toggleSection(script.id, section.id)}
                                        className="w-full text-left p-4 flex items-center gap-3"
                                      >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                          section.priority === "high" ? "bg-red-500/15" : section.priority === "medium" ? "bg-amber-500/15" : "bg-emerald-500/15"
                                        }`}>
                                          <span className={`text-xs font-bold ${
                                            section.priority === "high" ? "text-red-400" : section.priority === "medium" ? "text-amber-400" : "text-emerald-400"
                                          }`}>{idx + 1}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold text-foreground">{section.name}</span>
                                            <Badge variant="outline" className={`text-[10px] ${getPriorityColor(section.priority)}`}>
                                              {getPriorityLabel(section.priority)}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground ml-auto mr-2">{section.score}/{section.maxScore}</span>
                                          </div>
                                          <div className="h-1.5 bg-muted rounded-full overflow-hidden max-w-[200px]">
                                            <div
                                              className={`h-full rounded-full ${getScoreColor(section.score, section.maxScore)}`}
                                              style={{ width: `${(section.score / section.maxScore) * 100}%` }}
                                            />
                                          </div>
                                        </div>
                                        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                                      </button>

                                      {/* Section conversation script */}
                                      {isOpen && (
                                        <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-4">
                                          {/* Opening line */}
                                          <div className="flex gap-3">
                                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                                              <MessageCircle className="w-3 h-3 text-primary" />
                                            </div>
                                            <div>
                                              <p className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">Jak zacząć tę sekcję</p>
                                              <p className="text-sm text-foreground bg-primary/5 p-3 rounded-xl border border-primary/20 italic leading-relaxed">
                                                "{section.opening}"
                                              </p>
                                            </div>
                                          </div>

                                          {/* Talking points */}
                                          {section.talkingPoints.map((tp, tpIdx) => (
                                            <div key={tpIdx} className="ml-2 border-l-2 border-border/40 pl-4 space-y-2">
                                              <h5 className="text-xs font-bold text-foreground flex items-center gap-2">
                                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                                {tp.topic}
                                              </h5>

                                              {/* What to say */}
                                              <div className="bg-muted/20 p-3 rounded-lg border border-border/30">
                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 flex items-center gap-1">
                                                  <Quote className="w-3 h-3" /> Co powiedzieć
                                                </p>
                                                <p className="text-sm text-foreground leading-relaxed italic">"{tp.whatToSay}"</p>
                                              </div>

                                              {/* Question to ask */}
                                              <div className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/20">
                                                <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold mb-1 flex items-center gap-1">
                                                  <HelpCircle className="w-3 h-3" /> Pytanie do klientki
                                                </p>
                                                <p className="text-sm text-foreground leading-relaxed italic">"{tp.question}"</p>
                                              </div>

                                              {/* If resistance */}
                                              <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/20">
                                                <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-1 flex items-center gap-1">
                                                  <Shield className="w-3 h-3" /> Jeśli opór / wątpliwości
                                                </p>
                                                <p className="text-sm text-foreground leading-relaxed italic">"{tp.ifResistance}"</p>
                                              </div>
                                            </div>
                                          ))}

                                          {/* Closing argument */}
                                          <div className="flex gap-3">
                                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            </div>
                                            <div>
                                              <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-1">Podsumowanie sekcji</p>
                                              <p className="text-sm text-foreground bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20 italic leading-relaxed">
                                                "{section.closingArgument}"
                                              </p>
                                            </div>
                                          </div>

                                          {/* Transition */}
                                          {section.transition && (
                                            <div className="flex items-center gap-2 pt-2">
                                              <ArrowRight className="w-4 h-4 text-primary" />
                                              <p className="text-xs text-primary font-medium italic">Przejście: "{section.transition}"</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                              {/* ── CLOSING ── */}
                              <div className="mt-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-primary/5 to-pink-500/5 border border-primary/20">
                                <div className="flex items-center gap-2 mb-4">
                                  <Target className="w-4 h-4 text-primary" />
                                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Zamknięcie rozmowy</h4>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Podsumowanie</p>
                                    <p className="text-sm text-foreground italic leading-relaxed">"{script.closing.summary}"</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">Następne kroki</p>
                                    <p className="text-sm text-foreground italic leading-relaxed">"{script.closing.nextSteps}"</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-1">Urgency / FOMO</p>
                                    <p className="text-sm text-foreground italic leading-relaxed">"{script.closing.urgency}"</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty state */}
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border/50 bg-muted/10">
                    <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Nowe schematy pojawią się automatycznie po wygenerowaniu audytu w{" "}
                      <button onClick={() => navigate('/audit-generator')} className="text-primary hover:underline font-medium">
                        Generatorze Audytów
                      </button>
                    </p>
                  </div>
                </div>
              </div>

              {/* ============ RIGHT: KNOWLEDGE BASE (secondary) ============ */}
              <div className="xl:w-[420px] xl:flex-shrink-0">
                <div className="xl:sticky xl:top-6 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-base font-semibold text-muted-foreground">Baza wiedzy</h2>
                  </div>

                  {/* KB Tabs */}
                  <div className="flex gap-1 p-1 bg-muted/30 rounded-lg w-fit">
                    {([
                      { id: "process" as const, label: "Proces", icon: ArrowRight },
                      { id: "objections" as const, label: "Obiekcje", icon: AlertCircle },
                      { id: "rules" as const, label: "Zasady", icon: Star },
                    ]).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveKBTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          activeKBTab === tab.id
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Process */}
                  {activeKBTab === "process" && (
                    <div className="space-y-2">
                      {processSteps.map((step) => (
                        <Collapsible
                          key={step.id}
                          open={expandedStep === step.id}
                          onOpenChange={(open) => setExpandedStep(open ? step.id : null)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/40 hover:border-border/70 transition-all text-left">
                              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <step.icon className="w-3.5 h-3.5 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-foreground">{step.title}</span>
                                  <Badge variant="outline" className="text-[9px] border-border/50 text-muted-foreground">{step.timing}</Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">{step.description}</p>
                              </div>
                              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0 ${expandedStep === step.id ? 'rotate-180' : ''}`} />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-1 mb-2 ml-10 p-3 rounded-lg bg-muted/20 border border-border/30 space-y-3">
                              <div>
                                <h5 className="text-[10px] font-bold text-foreground flex items-center gap-1 mb-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Co robić
                                </h5>
                                <ul className="space-y-0.5">
                                  {step.details.map((d, i) => (
                                    <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                                      <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />{d}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h5 className="text-[10px] font-bold text-foreground flex items-center gap-1 mb-1">
                                  <Lightbulb className="w-3 h-3 text-amber-500" /> Tipy
                                </h5>
                                <ul className="space-y-0.5">
                                  {step.tips.map((t, i) => (
                                    <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                                      <div className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />{t}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h5 className="text-[10px] font-bold text-foreground flex items-center gap-1 mb-1">
                                  <XCircle className="w-3 h-3 text-red-500" /> Unikaj
                                </h5>
                                <ul className="space-y-0.5">
                                  {step.donts.map((d, i) => (
                                    <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                                      <div className="w-1 h-1 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />{d}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  )}

                  {/* Objections */}
                  {activeKBTab === "objections" && (
                    <div className="space-y-2">
                      {objectionHandling.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-card border border-border/40 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.icon}</span>
                            <div>
                              <Badge variant="outline" className="text-[9px] mb-0.5">{item.category}</Badge>
                              <p className="text-xs font-semibold text-foreground">"{item.objection}"</p>
                            </div>
                          </div>
                          {item.responses.map((resp, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border/20">
                              <Badge variant="secondary" className="text-[9px] mb-1">{resp.technique}</Badge>
                              <p className="text-[11px] text-foreground leading-relaxed italic">"{resp.response}"</p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rules */}
                  {activeKBTab === "rules" && (
                    <div className="space-y-2">
                      {goldenRules.map((rule, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <rule.icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-foreground">{rule.title}</h4>
                            <p className="text-[11px] text-muted-foreground">{rule.tip}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
          
      </ScrollArea>
    </AppLayout>
  );
}
