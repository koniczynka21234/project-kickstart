/**
 * Generates conversation talking points from audit findings.
 * Each finding becomes a talking section with intro, what to say,
 * how to sell, and possible objections.
 */

import {
  AUDIT_CATEGORIES,
  type AuditCategoryDef,
  type AuditFinding,
  type AuditSubSectionDef,
} from "@/components/audit/auditFindings";

export interface ConversationTalkingPoint {
  findingId: string;
  label: string;
  type: "positive" | "issue";
  subSectionName: string;
  introduction: string;
  whatToSay: string;
  howToSell: string;
  salesTechnique: string;
  possibleQuestions: { question: string; answer: string }[];
  transitionToNext: string;
}

export interface ConversationSection {
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
  openingLine: string;
  openingTechnique: string;
  talkingPoints: ConversationTalkingPoint[];
  closingLine: string;
  closingSellLine: string;
}

// Category-specific opening lines for conversation
const CATEGORY_OPENERS: Record<string, string> = {
  facebook: "Zacznijmy od Twojego profilu na Facebooku. Przeanalizowałam go dokładnie i mam kilka konkretnych obserwacji, które mogą pomóc Ci przyciągnąć więcej klientek.",
  instagram: "Przejdźmy teraz do Instagrama — to kluczowa platforma w branży beauty. Sprawdziłam Twój profil i chcę Ci pokazać co już robisz dobrze, a co warto poprawić.",
  content: "Teraz porozmawiajmy o treściach, które publikujesz. Zdjęcia, opisy, regularność — to trzy rzeczy, które najbardziej wpływają na Twoje zasięgi i to, ile klientek do Ciebie trafia.",
  stories_reels: "Chcę Ci teraz powiedzieć o Stories i Reels — to formaty, które obecnie dają największe zasięgi na Instagramie. Sprawdziłam jak je wykorzystujesz.",
  branding: "Porozmawiajmy o Twojej identyfikacji wizualnej — czyli jak Twój salon jest postrzegany wizualnie. To wpływa na to, czy klientka uzna Cię za profesjonalny salon, czy przescrolluje dalej.",
  competition: "Przeanalizowałam też Twoją konkurencję w okolicy — chcę Ci pokazać, jak wypadasz na tle innych salonów i co możesz zrobić, żeby się wyróżnić.",
  paid_ads: "Teraz o reklamach płatnych. Dobrze ustawione reklamy mogą przynieść nowych klientek już w pierwszym tygodniu — zobaczmy jak to wygląda u Ciebie.",
  google_gmb: "Przejdźmy do Google i wizytówki Google Maps. Wiele klientek szuka salonu właśnie tam — wpisuje 'fryzjer + miasto' i klika pierwszy wynik.",
  website: "Na koniec porozmawiamy o Twojej stronie internetowej. Strona to Twoja wizytówka, która pracuje 24/7 — sprawdźmy jak ją można usprawnić.",
};

const CATEGORY_OPENING_TECHNIQUES: Record<string, string> = {
  facebook: "Zacznij od pozytywu — nawet małego. Buduje to otwartość na feedback. Powiedz np. 'Widzę, że masz profil i go prowadzisz — to już lepiej niż 40% salonów, które analizuję.'",
  instagram: "Instagram to emocjonalny temat dla wielu właścicielek. Zacznij delikatnie, nie krytykuj wprost. Powiedz 'Sprawdziłam Twój profil i widzę, że wkładasz w niego pracę.'",
  content: "Treści to często bolesny punkt — właścicielki wiedzą, że powinny pisać, ale nie mają czasu. Zamiast krytykować, pokaż jak ŁATWO to poprawić.",
  stories_reels: "Stories/Reels to temat, gdzie wiele osób czuje się niepewnie. Normalizuj to: 'Większość salonów nie wykorzystuje tego formatu — masz szansę się wyróżnić.'",
  branding: "Branding to abstrakcyjny temat dla wielu. Użyj konkretnych przykładów: 'Wyobraź sobie, że klientka widzi Twój post obok postu konkurencji...'",
  competition: "Analiza konkurencji to mocny argument sprzedażowy. Pokaż konkretne różnice, ale nie obrażaj konkurencji — skup się na możliwościach klientki.",
  paid_ads: "Reklamy płatne to temat, który budzi obawy o koszty. Od razu uspokój: 'Nie chodzi o duże budżety — 10-20 zł dziennie to wystarczający start.'",
  google_gmb: "Google to obiektywny dowód — pokaż wyniki wyszukiwania. 'Wpisałam [usługa + miasto] i zobaczmy co się wyświetla...'",
  website: "Strona www to często zaniedbany obszar. Podejdź z empatią: 'Wiem, że strona to dodatkowy koszt i wysiłek, ale pokażę Ci dlaczego to się opłaca.'",
};

const CATEGORY_CLOSERS: Record<string, string> = {
  facebook: "To tyle jeśli chodzi o Facebook. Widzisz, to nie są ogromne zmiany — to konkrety, które można wdrożyć w ciągu kilku dni, a efekty zobaczysz w zasięgach.",
  instagram: "Widzisz, Instagram to nie jest rocket science — chodzi o konsekwencję i kilka prostych zasad. Te zmiany naprawdę robią różnicę.",
  content: "Podsumowując treści — kluczem jest regularność, dobra jakość zdjęć i angażujące opisy. To fundament, na którym budujesz swoją widoczność.",
  stories_reels: "Stories i Reels to obecnie najsilniejsze narzędzia do budowania relacji i zasięgów. Warto w nie zainwestować swój czas.",
  branding: "Spójny branding sprawia, że klientki zapamiętują Twój salon. To inwestycja, która procentuje z każdym postem.",
  competition: "Analiza konkurencji pokazuje, że masz sporo potencjału do wykorzystania. Kilka strategicznych zmian może Cię wyróżnić.",
  paid_ads: "Reklamy płatne to najszybszy sposób na nowe klientki — ale muszą być dobrze ustawione, żeby nie przepalać budżetu.",
  google_gmb: "Google to miejsce, gdzie klientki szukają salonu z intencją umówienia się. Optymalizacja wizytówki to must-have.",
  website: "Strona internetowa to Twoja cyfrowa wizytówka. Kilka poprawek może znacząco zwiększyć liczbę zapytań.",
};

const CATEGORY_CLOSING_SELL: Record<string, string> = {
  facebook: "To są rzeczy, które możesz poprawić sama — ale jeśli wolisz, żeby ktoś się tym zajął profesjonalnie i szybko, to właśnie tym się zajmujemy w ramach współpracy.",
  instagram: "Widzisz ile tu jest do zrobienia? I to tylko Instagram. Wyobraź sobie, że ktoś robi to za Ciebie — regularne posty, stories, wszystko spójne. To właśnie oferujemy.",
  content: "Tworzenie treści regularnie to wyzwanie, kiedy prowadzisz salon. W ramach współpracy przejmujemy to całkowicie — Ty robisz zdjęcia, my robimy resztę.",
  stories_reels: "Stories i Reels wymagają regularności i pomysłu. Możemy przygotowywać dla Ciebie gotowe scenariusze i szablony — Ty tylko nagrywasz.",
  branding: "Spójny branding to nasza specjalność — tworzymy pełną identyfikację wizualną, szablony postów, stories. Wszystko w jednym stylu.",
  competition: "Żeby wyprzedzić konkurencję, potrzebujesz strategii, nie przypadkowych działań. Właśnie to robimy — planujemy, tworzymy i analizujemy.",
  paid_ads: "Reklamy muszą być dobrze ustawione, żeby nie przepalać budżetu. Ustawiamy kampanie, monitorujemy wyniki i optymalizujemy — Ty masz nowe klientki.",
  google_gmb: "Optymalizacja Google to jednorazowa praca + regularna aktualizacja. Robimy to w ramach współpracy — ustawiamy i dbamy o widoczność.",
  website: "Strona to jednorazowa inwestycja, która pracuje 24/7. Możemy zrobić Ci prostą, ale profesjonalną stronę w ramach współpracy.",
};

function generateIntroduction(finding: AuditFinding, subSection: AuditSubSectionDef): string {
  if (finding.type === "positive") {
    return `Chcę Ci powiedzieć, że w kwestii „${subSection.name}" robisz to naprawdę dobrze. To nie jest standard — wiele salonów ma z tym problem, a Ty to masz ogarnięte.`;
  }
  return `Zwróciłam uwagę na jedną rzecz w kontekście „${subSection.name}" — to coś, co może Cię kosztować klientki, ale jest stosunkowo proste do naprawienia.`;
}

function generateWhatToSay(finding: AuditFinding): string {
  if (finding.type === "positive") {
    return `${finding.description} Warto to podtrzymywać i rozwijać, bo to daje Ci przewagę nad konkurencją. Powiedz klientce konkretnie CO jest dobrze i DLACZEGO to ma znaczenie.`;
  }
  return `${finding.description} Wytłumacz to prostym językiem — klientka musi zrozumieć JAK to wpływa na jej biznes. Użyj analogii: „To tak jakby..."`;
}

function generateHowToSell(finding: AuditFinding): string {
  if (finding.type === "positive") {
    return "Pochwal klientkę za to co robi dobrze — buduje to zaufanie i otwartość na sugestie w innych obszarach. Klientka, która czuje się doceniona, jest bardziej skłonna do współpracy. Dodaj: 'To naprawdę dobrze — wiele salonów, które analizuję, tego nie ma.'";
  }
  if (!finding.recommendation) return "Wyjaśnij klientce, dlaczego to jest ważne i jak wpływa na jej salon. Pokaż, że rozwiązanie jest proste. Powiedz: 'To jest akurat coś, co łatwo naprawić i szybko zobaczysz efekty.'";
  return `${finding.recommendation} Podkreśl, że te zmiany nie wymagają dużo czasu ani pieniędzy, a efekt jest widoczny szybko. Dodaj: 'To jest dokładnie coś, czym się zajmujemy w ramach współpracy.'`;
}

function generateSalesTechnique(finding: AuditFinding): string {
  if (finding.type === "positive") {
    return "🟢 TECHNIKA: Komplement → Most → Sugestia. Pochwal za tę rzecz, potem powiedz 'A teraz pokaże Ci coś, gdzie widzę jeszcze większy potencjał...' — naturalnie przechodząc do problemu.";
  }
  const techniques = [
    "🔴 TECHNIKA: Problem → Konsekwencja → Rozwiązanie. Pokaż problem, wyjaśnij ile klientek może tracić, zaproponuj rozwiązanie. 'To może oznaczać, że X klientek miesięcznie przechodzi obok Twojego profilu.'",
    "🔴 TECHNIKA: Porównanie z konkurencją. 'Widzisz, Twoja konkurencja [Salon X] już to robi — i ma [efekt]. Ty masz lepsze usługi, ale one o Tobie nie wiedzą.'",
    "🔴 TECHNIKA: Utracone przychody. Przelicz na pieniądze: 'Jeśli przez to tracisz choćby 2 klientki miesięcznie, to przy średniej wizycie 150 zł — tracisz 300 zł/mies, 3600 zł/rok.'",
    "🔴 TECHNIKA: Social proof. 'U naszych klientek, które to poprawiły, zasięgi wzrosły średnio o 40% w ciągu 2 tygodni.'",
  ];
  return techniques[Math.abs(hashCode(finding.id)) % techniques.length];
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

function generateTransition(finding: AuditFinding): string {
  if (finding.type === "positive") {
    return "Super, to mamy. A teraz zobaczmy kolejną rzecz, która mi się rzuciła w oczy...";
  }
  const transitions = [
    "OK, to mamy omówione. Przejdźmy do kolejnej rzeczy, którą zauważyłam...",
    "Dobrze, idźmy dalej — mam jeszcze kilka ciekawych obserwacji...",
    "To jest ważne, ale nie jedyna rzecz. Zobaczmy co jeszcze można poprawić...",
    "Rozumiesz o co chodzi? Super. To lecimy dalej...",
  ];
  return transitions[Math.abs(hashCode(finding.id)) % transitions.length];
}

function generatePossibleQuestions(finding: AuditFinding): { question: string; answer: string }[] {
  if (finding.type === "positive") {
    return [
      {
        question: "Skąd wiem, że to naprawdę dobrze wygląda?",
        answer: "Porównuję Twój profil z setkami innych salonów, które analizowałam. To, co u Ciebie widzę, jest powyżej średniej — konkretnie mówię o standardach, nie komplementach."
      },
      {
        question: "Czy mogę to jeszcze bardziej rozwinąć?",
        answer: "Oczywiście! To, że robisz to dobrze, nie znaczy, że nie da się lepiej. Pokażę Ci jak to zeskalować i wyciągnąć z tego jeszcze więcej korzyści."
      },
    ];
  }

  const questions: { question: string; answer: string }[] = [];

  questions.push({
    question: "Czy to naprawdę aż tak ważne?",
    answer: "Tak, bo klientki podejmują decyzje w kilka sekund. Jeśli coś wygląda nieprofesjonalnie, scrollują dalej — nawet jeśli Twoje usługi są świetne. Nie chodzi o perfekcję, ale o to, żeby nie tracić klientek na prostych rzeczach."
  });

  questions.push({
    question: "Ile czasu zajmie poprawa tego?",
    answer: "To kwestia kilku godzin, nie dni. Większość tych zmian możesz wdrożyć sama w ciągu jednego popołudnia. A efekty zobaczysz bardzo szybko."
  });

  questions.push({
    question: "Nie mam na to czasu, prowadzę salon...",
    answer: "Rozumiem — dlatego właśnie istniejemy. Możesz to zrobić sama krok po kroku, albo oddać to nam. My się zajmujemy marketingiem, Ty robisz to co kochasz — obsługujesz klientki. To dlatego nasze klientki z nami współpracują."
  });

  if (finding.recommendation) {
    questions.push({
      question: "Nie wiem jak to zrobić, czy mogę to zlecić?",
      answer: "Oczywiście — możesz to zrobić sama krok po kroku (pokażę Ci jak), albo możemy to włączyć w zakres współpracy. Wtedy zajmiemy się tym za Ciebie kompleksowo."
    });
  }

  questions.push({
    question: "Ile to będzie kosztować?",
    answer: "To zależy od zakresu — ale powiem Ci tak: koszt niepoprawienia tego jest wyższy. Jeśli tracisz choćby kilka klientek miesięcznie przez te rzeczy, to się nie opłaca oszczędzać na marketingu. O konkretach porozmawiamy, jak przejdziemy cały audyt."
  });

  return questions;
}

export function generateConversationGuide(
  enabledCategories: Record<string, boolean>,
  checkedFindings: Record<string, boolean>,
  includeAcademy: boolean = false,
): ConversationSection[] {
  const sections: ConversationSection[] = [];

  for (const cat of AUDIT_CATEGORIES) {
    if (!enabledCategories[cat.id]) continue;

    const talkingPoints: ConversationTalkingPoint[] = [];

    for (const sub of cat.subSections) {
      for (const finding of sub.findings) {
        if (!checkedFindings[finding.id]) continue;
        talkingPoints.push({
          findingId: finding.id,
          label: finding.label,
          type: finding.type,
          subSectionName: sub.name,
          introduction: generateIntroduction(finding, sub),
          whatToSay: generateWhatToSay(finding),
          howToSell: generateHowToSell(finding),
          salesTechnique: generateSalesTechnique(finding),
          possibleQuestions: generatePossibleQuestions(finding),
          transitionToNext: generateTransition(finding),
        });
      }
    }

    if (talkingPoints.length === 0) continue;

    sections.push({
      categoryId: cat.id,
      categoryName: cat.name,
      categoryDescription: cat.description,
      openingLine: CATEGORY_OPENERS[cat.id] || "Przejdźmy do kolejnej sekcji audytu.",
      openingTechnique: CATEGORY_OPENING_TECHNIQUES[cat.id] || "Zacznij od pozytywu, potem przejdź do obserwacji.",
      talkingPoints,
      closingLine: CATEGORY_CLOSERS[cat.id] || "To tyle w tej sekcji. Przejdźmy dalej.",
      closingSellLine: CATEGORY_CLOSING_SELL[cat.id] || "To są rzeczy, którymi się zajmujemy w ramach współpracy — jeśli chcesz, możemy to ogarnąć za Ciebie.",
    });
  }

  // Add Aurine Academy section if enabled
  if (includeAcademy) {
    sections.push({
      categoryId: "academy",
      categoryName: "Aurine Academy",
      categoryDescription: "Program szkoleniowy i edukacyjny dla właścicielek salonów beauty.",
      openingLine: "Chciałam Ci też opowiedzieć o czymś dodatkowym — mamy program Aurine Academy, który pomaga właścicielkom salonów rozwijać się nie tylko w marketingu, ale też w prowadzeniu biznesu.",
      openingTechnique: "Academy to wartość dodana, nie główny produkt. Przedstaw to jako bonus, nie jako dodatkowy koszt. Powiedz: 'To jest coś, co dostają nasze klientki w ramach współpracy.'",
      talkingPoints: [
        {
          findingId: "academy_intro",
          label: "Czym jest Aurine Academy?",
          type: "positive",
          subSectionName: "Program edukacyjny",
          introduction: "Aurine Academy to nasz autorski program edukacyjny dla właścicielek salonów beauty. Zawiera gotowe materiały, szkolenia i narzędzia do rozwoju biznesu.",
          whatToSay: "W Academy masz dostęp do szkoleń z social media, zarządzania salonem, obsługi klienta i budowania marki osobistej. To nie jest teoria — to praktyczne narzędzia, które od razu możesz wdrożyć.",
          howToSell: "Academy to Twoja przewaga konkurencyjna. Inne salony działają na wyczucie — Ty będziesz mieć gotowe strategie i sprawdzone rozwiązania. To jak mieć mentora biznesowego na wyciągnięcie ręki.",
          salesTechnique: "🟢 TECHNIKA: Ekskluzywność. 'To nie jest dostępne publicznie — to program tylko dla naszych klientek. Dostajesz go w ramach współpracy.'",
          possibleQuestions: [
            { question: "Czy muszę za to osobno płacić?", answer: "Nie — Academy jest częścią współpracy z nami. To dodatkowa wartość, którą dostajesz bez dodatkowych kosztów." },
            { question: "Ile czasu muszę na to poświęcić?", answer: "Materiały są krótkie i praktyczne — 15-30 minut tygodniowo wystarczy. Możesz się uczyć w swoim tempie, kiedy masz czas." },
          ],
          transitionToNext: "Dobrze, to było tyle o Academy. Przejdźmy teraz do podsumowania tego co dzisiaj omawiałyśmy...",
        },
      ],
      closingLine: "Academy to Twoja dodatkowa wartość — szkolenia, narzędzia i wsparcie w jednym miejscu.",
      closingSellLine: "To jest coś, co odróżnia naszą współpracę od innych agencji — nie tylko robimy marketing, ale też uczymy i wspieramy Twój rozwój.",
    });
  }

  return sections;
}
