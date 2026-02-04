import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mail, Phone, MessageSquare, FileSignature, CheckCircle2, 
  AlertCircle, Lightbulb, Target, Heart, Clock, 
  Users, TrendingUp, Shield, Star, XCircle,
  Package, ChevronDown, ChevronUp, ArrowRight, Sparkles
} from "lucide-react";

const processSteps = [
  {
    id: 1,
    title: "Cold Mail + Prezentacja",
    icon: Mail,
    description: "Pierwszy kontakt z potencjalnym klientem",
    timing: "Dzień 1",
    gradient: "from-blue-500 to-cyan-500",
    details: [
      "Personalizacja - użyj nazwy salonu i miasta w mailu",
      "Krótka, zwięzła wiadomość (max 150 słów)",
      "Załącz prezentację PDF - pokazuje profesjonalizm",
      "Prezentacja mówi za Ciebie - edukuje o Facebook Ads",
      "Jeden jasny CTA - zachęta do rozmowy"
    ],
    tips: [
      "Wysyłaj wt-czw w godzinach 9-11 lub 14-16",
      "Unikaj poniedziałków (za dużo maili) i piątków (weekend)",
      "Sprawdź profil salonu i social media przed wysłaniem"
    ],
    donts: [
      "Nie wysyłaj bez prezentacji - mail sam w sobie jest za słaby",
      "Nie pisz długich elaboratów - nikt tego nie przeczyta",
      "Nie używaj 'Szanowna Pani' - brzmi jak spam"
    ]
  },
  {
    id: 2,
    title: "SMS Follow-up",
    icon: MessageSquare,
    description: "Celowy trigger 2 dni po cold mailu",
    timing: "Dzień 3",
    gradient: "from-pink-500 to-rose-500",
    details: [
      "SMS wychodzi 2 dni po cold mailu jako celowy trigger",
      "Bardzo krótki - max 160 znaków",
      "Nawiąż do wysłanego maila z prezentacją",
      "Bezpośrednie pytanie o zainteresowanie"
    ],
    tips: [
      "SMS wysyłaj w godzinach pracy salonu (10-17)",
      "Unikaj weekendów i poniedziałków",
      "Jeden SMS wystarczy - nie spamuj"
    ],
    donts: [
      "Nie wysyłaj SMS-ów wieczorem",
      "Nie pisz długich wiadomości",
      "Nie dzwoń bez uprzedzenia SMS-em"
    ]
  },
  {
    id: 3,
    title: "Follow-up Email #1",
    icon: Clock,
    description: "Przypomnienie po 3-4 dniach od SMS",
    timing: "Dzień 6-7",
    gradient: "from-purple-500 to-violet-500",
    details: [
      "Nawiąż do poprzedniej wiadomości i prezentacji",
      "Dodaj nową wartość - case study, konkretna statystyka",
      "Zadaj otwarte pytanie o ich salon",
      "Krótsze niż cold mail - max 80 słów"
    ],
    tips: [
      "Bądź pomocny, nie nachalny",
      "Może być bardziej osobisty ton",
      "Możesz nawiązać do czegoś z ich social media"
    ],
    donts: [
      "Nie przepraszaj za 'nachodzenie'",
      "Nie pisz 'pewnie nie miała Pani czasu'",
      "Nie powtarzaj treści pierwszego maila"
    ]
  },
  {
    id: 4,
    title: "Follow-up Email #2",
    icon: Mail,
    description: "Ostatni follow-up po kolejnych 4-5 dniach",
    timing: "Dzień 10-12",
    gradient: "from-indigo-500 to-blue-500",
    details: [
      "Ostatni email w sekwencji",
      "Bardziej bezpośrednie pytanie o zainteresowanie",
      "Możesz użyć techniki 'break-up email'",
      "Daj jasną opcję rezygnacji"
    ],
    tips: [
      "Break-up email często działa lepiej niż nachalne przypominanie",
      "Możesz napisać 'jeśli teraz nie jest dobry moment, wróćmy za 3 miesiące'",
      "Bądź szczery i bezpośredni"
    ],
    donts: [
      "Nie bądź zdesperowany",
      "Nie obwiniaj ich za brak odpowiedzi",
      "Nie wysyłaj więcej niż 2 follow-upy mailowe"
    ]
  },
  {
    id: 5,
    title: "Rozmowa telefoniczna",
    icon: Phone,
    description: "Kluczowy moment sprzedaży",
    timing: "Gdy odpowie",
    gradient: "from-green-500 to-emerald-500",
    details: [
      "Przygotuj się - sprawdź ponownie profil salonu",
      "Zacznij od pytań, nie od sprzedaży",
      "Słuchaj więcej niż mówisz (zasada 70/30)",
      "Diagnozuj problemy - dopiero potem proponuj rozwiązanie",
      "Zawsze kończ z ustalonym następnym krokiem"
    ],
    tips: [
      "Dzwoń stojąc - lepszy głos i energia",
      "Uśmiechaj się - naprawdę to słychać",
      "Miej notes przy sobie na notatki",
      "Najlepsze godziny: 10-12, 14-16"
    ],
    donts: [
      "Nie recytuj skryptu - bądź naturalny",
      "Nie mów tylko o sobie i ofercie",
      "Nie przerywaj klientowi",
      "Nie kończ rozmowy bez ustalenia następnego kroku"
    ]
  },
  {
    id: 6,
    title: "Negocjacje i Oferta",
    icon: Target,
    description: "Dopasowanie oferty do potrzeb",
    timing: "Po rozmowie",
    gradient: "from-orange-500 to-amber-500",
    details: [
      "Przygotuj spersonalizowaną ofertę",
      "Odnieś się do konkretnych problemów z rozmowy",
      "Przedstaw 2-3 opcje cenowe",
      "Pokaż case studies z podobnych salonów"
    ],
    tips: [
      "Wyślij ofertę tego samego dnia po rozmowie",
      "Umów się na rozmowę o ofercie - nie zostawiaj 'do przemyślenia'",
      "Przygotuj odpowiedzi na typowe obiekcje"
    ],
    donts: [
      "Nie dawaj zbyt dużo czasu 'do namysłu'",
      "Nie wysyłaj oferty bez wcześniejszej rozmowy",
      "Nie obniżaj ceny bez uzasadnienia"
    ]
  },
  {
    id: 7,
    title: "Umowa i Onboarding",
    icon: FileSignature,
    description: "Finalizacja i start współpracy",
    timing: "Finał",
    gradient: "from-emerald-500 to-teal-500",
    details: [
      "Wyślij umowę natychmiast po akceptacji oferty",
      "Omów wszystkie punkty umowy telefonicznie",
      "Ustal konkretną datę startu kampanii",
      "Dodaj się do Business Managera klienta",
      "Wyślij Welcome Pack z harmonogramem współpracy"
    ],
    tips: [
      "Deadline na podpisanie - max 3 dni",
      "Potwierdź wszystko mailowo",
      "Wyślij checklistę rzeczy do przygotowania",
      "Zaplanuj pierwszy raport i spotkanie"
    ],
    donts: [
      "Nie zostawiaj umowy 'do przemyślenia' na tydzień",
      "Nie zaczynaj bez podpisanej umowy",
      "Nie zapominaj o onboardingu - to buduje relację"
    ]
  }
];

const objectionHandling = [
  {
    objection: "To za drogo",
    icon: "💰",
    category: "Cena",
    responses: [
      { response: "Rozumiem. Ale policzmy - ile kosztuje Was teraz pozyskanie jednego klienta? Nasi klienci płacą średnio 15-25 zł za rezerwację.", technique: "Porównanie kosztów" },
      { response: "Drogo w porównaniu do czego? Posty na Facebooku nic nie kosztują, ale też nic nie dają.", technique: "Pytanie zwrotne" },
      { response: "Ile kosztuje Was puste miejsce w grafiku? Bo właśnie to możemy wypełnić.", technique: "Koszt alternatywny" }
    ]
  },
  {
    objection: "Muszę się zastanowić",
    icon: "🤔",
    category: "Odkładanie",
    responses: [
      { response: "Jasne, ale nad czym konkretnie? Może mogę pomóc odpowiedzieć na wątpliwości teraz.", technique: "Konkretyzacja" },
      { response: "Oczywiście. Kiedy mogę oddzwonić? Mam wolne miejsce w kalendarzu w tym tygodniu.", technique: "Ustalenie follow-upu" },
      { response: "Rozumiem. Co musiałoby się wydarzyć, żebyście byli pewni swojej decyzji?", technique: "Identyfikacja bariery" }
    ]
  },
  {
    objection: "Nie mam czasu na marketing",
    icon: "⏰",
    category: "Czas",
    responses: [
      { response: "Właśnie dlatego my się tym zajmujemy! Potrzebujemy od Was tylko 30 minut na start.", technique: "Odwrócenie obiekcji" },
      { response: "To idealnie - bo nasi klienci poświęcają na współpracę z nami max 2 godziny miesięcznie.", technique: "Konkretne liczby" },
      { response: "A ile czasu poświęcacie na posty, które i tak nie działają?", technique: "Porównanie czasu" }
    ]
  },
  {
    objection: "Facebook Ads nie działają",
    icon: "📱",
    category: "Sceptycyzm",
    responses: [
      { response: "Rozumiem to rozczarowanie. Ale czy kampanię prowadziła agencja specjalizująca się w beauty? Bo to ma ogromne znaczenie.", technique: "Specjalizacja" },
      { response: "Co konkretnie nie zadziałało? Bo najczęściej problem leży w targetowaniu lub kreacjach.", technique: "Diagnoza problemu" },
      { response: "Mogę pokazać wyniki naszych klientów z podobnych salonów - potem możemy wrócić do rozmowy.", technique: "Dowód społeczny" }
    ]
  },
  {
    objection: "Mam już kogoś od marketingu",
    icon: "👥",
    category: "Konkurencja",
    responses: [
      { response: "Super! A jakie wyniki osiągacie? Bo chętnie porównamy nasze rezultaty.", technique: "Wyzwanie" },
      { response: "To świetnie. A jak wygląda koszt pozyskania klienta u Was?", technique: "Pytanie o metryki" },
      { response: "Rozumiem. Gdyby jednak obecna współpraca nie przynosiła oczekiwanych efektów - możemy wrócić do rozmowy?", technique: "Zostawienie drzwi otwartych" }
    ]
  },
  {
    objection: "Muszę porozmawiać z partnerem/mężem",
    icon: "👫",
    category: "Odkładanie",
    responses: [
      { response: "Rozumiem. Może umówmy się na rozmowę we trójkę? Chętnie odpowiem na wszystkie pytania.", technique: "Wspólne spotkanie" },
      { response: "Jasne! Co według Ciebie będzie dla niego najważniejsze? Mogę przygotować te informacje.", technique: "Przygotowanie argumentów" },
      { response: "Oczywiście. Kiedy planujecie to omówić? Odezwę się dzień później.", technique: "Konkretny follow-up" }
    ]
  }
];

const goldenRules = [
  {
    icon: Heart,
    title: "Bądź autentyczny",
    description: "Klienci wyczuwają sztuczność. Mów swoimi słowami, nie skryptem. Bądź sobą.",
    gradient: "from-pink-500 to-rose-500",
    examples: ["Używaj naturalnego języka", "Dziel się własnymi przemyśleniami", "Przyznawaj się do niewiedzy"]
  },
  {
    icon: Users,
    title: "Słuchaj więcej niż mówisz",
    description: "Zasada 70/30 - klient powinien mówić więcej niż Ty. Zadawaj pytania i słuchaj odpowiedzi.",
    gradient: "from-blue-500 to-indigo-500",
    examples: ["Nie przerywaj", "Parafrazuj to co słyszysz", "Zadawaj pytania pogłębiające"]
  },
  {
    icon: Lightbulb,
    title: "Rozwiązuj problemy",
    description: "Nie sprzedawaj usługi - oferuj rozwiązanie konkretnego problemu klienta.",
    gradient: "from-amber-500 to-orange-500",
    examples: ["Zidentyfikuj główny problem", "Pokaż jak go rozwiązujesz", "Przedstaw korzyść, nie funkcję"]
  },
  {
    icon: TrendingUp,
    title: "Mów o wynikach",
    description: "Konkretne liczby i case studies są bardziej przekonujące niż ogólne obietnice.",
    gradient: "from-green-500 to-emerald-500",
    examples: ["15-25 zł za rezerwację", "30 nowych klientek miesięcznie", "200% wzrost zapisów"]
  },
  {
    icon: Shield,
    title: "Buduj zaufanie",
    description: "Nie obiecuj cudów. Szczerość buduje długoterminowe relacje biznesowe.",
    gradient: "from-purple-500 to-violet-500",
    examples: ["Mów o realnych oczekiwaniach", "Nie obiecuj 100% gwarancji", "Bądź transparentny z cenami"]
  },
  {
    icon: Star,
    title: "Follow-up jest kluczem",
    description: "80% sprzedaży wymaga 5+ kontaktów. Wytrwałość (nie nachalność) wygrywa.",
    gradient: "from-yellow-500 to-amber-500",
    examples: ["Systematyczne przypomnienia", "Różne kanały kontaktu", "Cierpliwość się opłaca"]
  }
];

const conversationQuestions = [
  {
    category: "Pytania otwierające",
    icon: MessageSquare,
    gradient: "from-blue-500 to-cyan-500",
    questions: [
      { q: "Jak obecnie pozyskujecie nowych klientów?", why: "Pozwala zrozumieć ich obecną strategię" },
      { q: "Co sprawia największy problem w promocji salonu?", why: "Identyfikuje główny pain point" },
      { q: "Jakie działania marketingowe próbowaliście do tej pory?", why: "Pokazuje ich doświadczenie z marketingiem" },
    ]
  },
  {
    category: "Pytania o problemy",
    icon: AlertCircle,
    gradient: "from-red-500 to-rose-500",
    questions: [
      { q: "Co Was najbardziej frustruje w obecnym marketingu?", why: "Emocjonalny pain point" },
      { q: "Czy mieliście złe doświadczenia z agencjami?", why: "Pozwala odnieść się do obaw" },
      { q: "Ile czasu poświęcacie na marketing tygodniowo?", why: "Pokazuje obciążenie czasowe" },
    ]
  },
  {
    category: "Pytania o cele",
    icon: Target,
    gradient: "from-green-500 to-emerald-500",
    questions: [
      { q: "Ile nowych klientek miesięcznie chcielibyście pozyskiwać?", why: "Konkretny cel do realizacji" },
      { q: "Jaki budżet możecie przeznaczyć na reklamę?", why: "Określa możliwości finansowe" },
      { q: "Jakie usługi chcecie najbardziej promować?", why: "Focus kampanii" },
    ]
  },
  {
    category: "Pytania zamykające",
    icon: CheckCircle2,
    gradient: "from-purple-500 to-violet-500",
    questions: [
      { q: "Co musiałoby się stać, żebyście zdecydowali się na współpracę?", why: "Identyfikuje ostatnie bariery" },
      { q: "Czy jest coś, co Was powstrzymuje przed decyzją?", why: "Daje szansę na obiekcje" },
      { q: "Kiedy moglibyśmy zacząć?", why: "Zakłada pozytywną odpowiedź" },
    ]
  }
];

type TabType = "process" | "conversation" | "objections" | "rules";

export default function ClientService() {
  const [activeTab, setActiveTab] = useState<TabType>("process");
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const navigate = useNavigate();

  const tabs = [
    { id: "process" as TabType, label: "Proces sprzedaży", icon: ArrowRight },
    { id: "conversation" as TabType, label: "Rozmowa", icon: MessageSquare },
    { id: "objections" as TabType, label: "Obiekcje", icon: AlertCircle },
    { id: "rules" as TabType, label: "Złote zasady", icon: Star },
  ];

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-4rem)] w-full max-w-full overflow-hidden">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-primary/10 via-card to-card">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(236,72,153,0.15),transparent_50%)]" />
          <div className="absolute top-4 right-8 flex gap-3 opacity-30">
            {[Sparkles, Star, Heart].map((Icon, i) => (
              <div key={i} className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
            ))}
          </div>
          <div className="relative max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center shadow-xl shadow-primary/30">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Obsługa Klienta</h1>
                  <p className="text-muted-foreground">Kompletny przewodnik od cold maila do umowy</p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/welcome-pack-generator')}
                className="bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90 text-white shadow-lg gap-2"
              >
                <Package className="w-4 h-4" />
                Generuj Welcome Pack
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-1 py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Process Tab */}
          {activeTab === "process" && (
            <div className="space-y-4">
              {/* Timeline */}
              <div className="flex items-center justify-center gap-3 p-4 bg-card/50 rounded-xl border border-border/50 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-muted-foreground">Cold Mail</span>
                </div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 max-w-md rounded-full" />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Umowa</span>
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
              </div>

              {/* Steps */}
              {processSteps.map((step) => (
                <Card 
                  key={step.id}
                  className={`bg-card/50 border-border/50 overflow-hidden transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/5 ${
                    expandedStep === step.id ? 'ring-2 ring-primary/30' : ''
                  }`}
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                >
                  <div className="flex flex-col">
                    {/* Header */}
                    <div className="flex items-center gap-4 p-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <step.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Krok {step.id}</Badge>
                          <Badge className={`text-[10px] bg-gradient-to-r ${step.gradient} text-white border-0`}>{step.timing}</Badge>
                        </div>
                        <h3 className="font-bold text-foreground text-lg">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      {expandedStep === step.id ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>

                    {/* Expanded */}
                    {expandedStep === step.id && (
                      <div className="border-t border-border/50 p-5 bg-gradient-to-b from-muted/30 to-transparent animate-fade-in">
                        <div className="grid md:grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              Co robić
                            </h4>
                            <ul className="space-y-2">
                              {step.details.map((detail, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-500" />
                              Pro tipy
                            </h4>
                            <ul className="space-y-2">
                              {step.tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-500" />
                              Czego nie robić
                            </h4>
                            <ul className="space-y-2">
                              {step.donts.map((dont, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                                  {dont}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Conversation Tab */}
          {activeTab === "conversation" && (
            <div className="grid md:grid-cols-2 gap-6">
              {conversationQuestions.map((topic, idx) => (
                <Card key={idx} className="bg-card/50 border-border/50 overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${topic.gradient} flex items-center justify-center shadow-lg`}>
                        <topic.icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{topic.category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topic.questions.map((item, i) => (
                      <div key={i} className="bg-muted/30 rounded-xl p-4 hover:bg-muted/50 transition-colors border border-border/30">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary">{i + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground mb-1">"{item.q}"</p>
                            <p className="text-xs text-muted-foreground">{item.why}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Objections Tab */}
          {activeTab === "objections" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {objectionHandling.map((item, idx) => (
                <Card key={idx} className="bg-card/50 border-border/50 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{item.icon}</span>
                      <div>
                        <Badge variant="outline" className="text-[10px] mb-1">{item.category}</Badge>
                        <CardTitle className="text-base">"{item.objection}"</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {item.responses.map((resp, i) => (
                      <div key={i} className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-4 border border-border/30">
                        <Badge variant="secondary" className="text-[10px] mb-2">{resp.technique}</Badge>
                        <p className="text-sm text-foreground">"{resp.response}"</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Golden Rules Tab */}
          {activeTab === "rules" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goldenRules.map((rule, idx) => (
                <Card key={idx} className="bg-card/50 border-border/50 overflow-hidden group hover:shadow-xl hover:shadow-primary/10 transition-all">
                  <CardHeader className="pb-3">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${rule.gradient} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                      <rule.icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{rule.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">{rule.description}</p>
                    <div className="space-y-2">
                      {rule.examples.map((example, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-foreground">{example}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
