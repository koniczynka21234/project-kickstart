 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 // Extended input validation schema
 const campaignInputSchema = z.object({
   clientName: z.string().min(1, "Client name is required").max(200, "Client name too long"),
   industry: z.string().max(100).optional().default("Beauty"),
   city: z.string().max(100).optional().default("Polska"),
   budget: z.union([z.string(), z.number()]).transform((val) => {
     const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.]/g, '')) : val;
     return isNaN(num) ? 0 : Math.min(num, 1000000);
   }),
   objective: z.string().max(500).optional(),
   targetAudience: z.string().max(500).optional(),
   services: z.string().max(1000).optional(),
   // New extended fields
   seasonality: z.string().max(200).optional(),
   promotions: z.string().max(500).optional(),
   competitors: z.string().max(500).optional(),
   usp: z.string().max(500).optional(),
   priceRange: z.string().max(100).optional(),
   existingFollowers: z.string().max(50).optional(),
   previousCampaigns: z.string().max(500).optional(),
 });
 
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     const body = await req.json();
     
     // Validate input
     const validationResult = campaignInputSchema.safeParse(body);
     if (!validationResult.success) {
       console.error('Validation error:', validationResult.error.errors);
       return new Response(JSON.stringify({ 
         error: 'Nieprawidłowe dane wejściowe',
         details: validationResult.error.errors.map(e => e.message)
       }), {
         status: 400,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
     }
 
     const { 
       clientName, industry, city, budget, objective, targetAudience, services,
       seasonality, promotions, competitors, usp, priceRange, existingFollowers, previousCampaigns
     } = validationResult.data;
     
     const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
     if (!GROQ_API_KEY) {
       console.error('GROQ_API_KEY is not configured in Supabase Secrets');
       return new Response(JSON.stringify({ 
         error: 'Brak klucza Groq API w Secrets',
         details: 'Dodaj GROQ_API_KEY w panelu Supabase → Project Settings → Secrets'
       }), {
         status: 500,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
     }
 
    const systemPrompt = `Jesteś SENIORSKIM STRATEGIEM PERFORMANCE MARKETINGU specjalizującym się w Meta Ads dla branży beauty w Polsce. Tworzysz GOTOWE DO WDROŻENIA kampanie, które generują rezerwacje i leady.

KRYTYCZNE ZASADY:
1. Wszystkie wartości MUSZĄ być stringami - NIGDY obiektami
2. Twórz KONKRETNE, GOTOWE DO SKOPIOWANIA teksty reklamowe - nie ogólniki
3. Każda kreacja musi mieć UNIKALNY, SZCZEGÓŁOWY opis grafiki (min. 30 słów)
4. Podawaj DOKŁADNE liczby: budżety w PLN, zasięgi, przedziały wiekowe
5. Teksty reklamowe muszą być EMOCJONALNE i zawierać KONKRETNE korzyści
6. Używaj hook'ów zatrzymujących scrollowanie (pytania, szokujące statystyki, FOMO)

WYMAGANIA DLA KREACJI:
- Nagłówki: max 40 znaków, konkretna korzyść, emocja lub pytanie
- Primary text: 80-125 znaków, emoji na początku, hook + korzyść + CTA
- imageIdea: SZCZEGÓŁOWY opis zdjęcia - kompozycja, oświetlenie, model/modelka, kolory, tło, styl (luxury/cozy/professional), rekwizyty, nastrój

PRZYKŁAD DOBREGO imageIdea:
"Zbliżenie kobiecych dłoni z eleganckim french manicure na tle białego marmurowego blatu, obok leży biała orchidea i złota biżuteria, miękkie naturalne światło z okna, premium spa aesthetic, shallow depth of field"

NIE PISZ: "Grafika przedstawiająca paznokcie" - to za mało szczegółowe!

Format odpowiedzi (ścisły JSON):
{
  "strategy": {
    "objective": "Główny cel: np. Generowanie 50+ leadów/mies. przy koszcie <15 PLN/lead",
    "targetAudience": "Kobiety 28-50 lat, dochód średni-wyższy, zainteresowania: beauty, wellness, moda premium, zakupy online, dbanie o siebie. Lokalizacja: [miasto] + 30km. Wykluczenia: pracownicy salonów beauty",
    "budget_allocation": "TOFU (40%): X PLN - zasięg i świadomość | MOFU (35%): X PLN - zaangażowanie i remarketing | BOFU (25%): X PLN - konwersje i rezerwacje",
    "timeline": "Tydzień 1-2: Budowanie świadomości, testowanie kreacji. Tydzień 3-4: Skalowanie najlepszych zestawów. Tydzień 5+: Optymalizacja pod konwersje",
    "daily_budget": "X PLN/dzień",
    "total_budget": "X PLN/miesiąc",
    "campaign_duration": "30 dni (zalecane minimum)",
    "funnel_stages": [
      {
        "stage": "Awareness (TOFU)",
        "objective": "Dotarcie do nowych odbiorców, budowanie rozpoznawalności salonu",
        "budget": "X PLN (40%)",
        "duration": "Ciągły",
        "kpis": ["Zasięg > X osób", "CPM < X PLN", "Częstotliwość 1.5-2.0"]
      },
      {
        "stage": "Consideration (MOFU)",
        "objective": "Zaangażowanie i remarketing osób które widziały reklamy",
        "budget": "X PLN (35%)",
        "duration": "Ciągły",
        "kpis": ["CTR > 2%", "CPC < X PLN", "Czas na stronie > 30s"]
      },
      {
        "stage": "Conversion (BOFU)",
        "objective": "Generowanie rezerwacji i leadów od ciepłych odbiorców",
        "budget": "X PLN (25%)",
        "duration": "Ciągły",
        "kpis": ["CPL < X PLN", "Konwersje > X/tydzień", "ROAS > 3.0"]
      }
    ]
  },
  "adSets": [
    {
      "name": "Core - Kobiety 28-45 Beauty Enthusiasts",
      "audience": "Wiek 28-45, Kobiety, Zainteresowania: Salon kosmetyczny, Manicure, Pedicure, Beauty, Self-care, Luksusowe kosmetyki. Lokalizacja: [miasto] +25km. Zachowania: Frequent online shoppers",
      "placement": "Facebook Feed, Instagram Feed, Instagram Stories, Reels",
      "dailyBudget": "X PLN",
      "bidStrategy": "Lowest cost z daily budget cap",
      "estimatedReach": "X-Y tys. osób/tydzień"
    },
    {
      "name": "Lookalike 1% - Similar to Existing Clients",
      "audience": "Lookalike 1% na podstawie listy klientów. Wiek 25-50, Kobiety. Automatyczne targetowanie Meta AI",
      "placement": "Advantage+ placements",
      "dailyBudget": "X PLN",
      "bidStrategy": "Cost cap X PLN",
      "estimatedReach": "X-Y tys. osób/tydzień"
    },
    {
      "name": "Remarketing - Website Visitors 30d",
      "audience": "Osoby które odwiedziły stronę w ciągu 30 dni. Custom Audience z Piksela",
      "placement": "All placements",
      "dailyBudget": "X PLN",
      "bidStrategy": "Lowest cost",
      "estimatedReach": "X-Y osób (ciepła grupa)"
    },
    {
      "name": "Remarketing - Social Engagers 14d",
      "audience": "Osoby które zareagowały na posty/reklamy w ciągu 14 dni",
      "placement": "Facebook Feed, Instagram Feed",
      "dailyBudget": "X PLN",
      "bidStrategy": "Lowest cost",
      "estimatedReach": "X-Y osób"
    }
  ],
  "posts": [
    {
      "type": "single",
      "platform": "facebook",
      "headline": "Zarezerwuj wizytę -20% 💅",
      "primaryText": "✨ Twoje paznokcie zasługują na więcej niż przeciętność. Odkryj manicure, który trzyma 3 tygodnie bez odpryskiwania! 💕 Tylko do końca tygodnia: -20% na pierwszą wizytę. Zarezerwuj teraz ➡️",
      "description": "Profesjonalny salon w centrum [miasta]",
      "cta": "Zarezerwuj",
      "imageIdea": "Zbliżenie kobiecych dłoni z perfekcyjnym nude manicure, eleganckie złote pierścionki, dłonie spoczywają na miękkim beżowym swetrze kaszmirowym, tło rozmyte w ciepłych beżowych tonach, naturalne miękkie światło, premium lifestyle aesthetic, focus na błyszczących paznokciach",
      "hook": "Twoje paznokcie zasługują na więcej",
      "targetEmotion": "Aspiracja do luksusu i profesjonalizmu"
    },
    {
      "type": "carousel",
      "platform": "instagram",
      "headline": "Metamorfoza w 2 godziny ✨",
      "primaryText": "👀 Przesuwaj i zobacz transformacje naszych klientek! Od zniszczonych paznokci do perfekcyjnego manicure. Która stylizacja jest Twoja? 💅 Napisz w komentarzu i umów się na wizytę!",
      "description": "Zobacz efekty naszej pracy",
      "cta": "Wyślij wiadomość",
      "imageIdea": "Karuzela 3 zdjęć before/after: 1) Zniszczone paznokcie vs piękny francuski manicure 2) Krótkie paznokcie vs eleganckie przedłużenie 3) Stary lakier vs świeży nude z delikatnym zdobieniem. Jasne tło, profesjonalne oświetlenie studyjne, spójny styl premium",
      "hook": "Przesuwaj i zobacz transformacje",
      "targetEmotion": "Social proof i aspiracja"
    },
    {
      "type": "reels",
      "platform": "instagram",
      "headline": "Tak wygląda perfekcja 💅",
      "primaryText": "🎬 3 sekundy które zmienią Twoje spojrzenie na manicure! Obejrzyj do końca 👀✨ Link w bio ➡️",
      "description": "Reels z procesu stylizacji",
      "cta": "Dowiedz się więcej",
      "imageIdea": "Dynamiczny kadr w stylu TikTok: zbliżenie procesu nakładania lakieru hybrydowego w slow motion, różowe/fioletowe oświetlenie LED, profesjonalna stylistka w eleganckim fartuchu, nowoczesne wnętrze salonu w tle, efekt ASMR - widoczne pociągnięcia pędzelka",
      "hook": "3 sekundy które zmienią Twoje spojrzenie",
      "targetEmotion": "Fascynacja procesem i jakością"
    },
    {
      "type": "story",
      "platform": "both",
      "headline": "🔥 Ostatnie 3 miejsca!",
      "primaryText": "Na ten weekend zostały tylko 3 wolne terminy! ⏰ Nie przegap okazji na -25% 💕 Swipe up ➡️",
      "description": "Story z urgency",
      "cta": "Zarezerwuj teraz",
      "imageIdea": "Pionowe zdjęcie story format: eleganckie wnętrze salonu z widocznym pustym fotelem do manicure, ciepłe oświetlenie, w tle rośliny i świece, overlay tekstu z licznikiem '3 wolne miejsca', premium minimalistyczny design, pastelowa kolorystyka",
      "hook": "Ostatnie 3 miejsca na weekend!",
      "targetEmotion": "FOMO i pilność"
    },
    {
      "type": "single",
      "platform": "facebook",
      "headline": "Dlaczego 847 kobiet nas wybrało?",
      "primaryText": "⭐ 4.9/5 na podstawie 847 opinii! 'Najlepszy salon w mieście' - Ania K. 'Wreszcie manicure który trzyma!' - Marta W. Dołącz do grona zadowolonych klientek 💕 Pierwsza wizyta -20% ➡️",
      "description": "847 zadowolonych klientek",
      "cta": "Sprawdź opinie",
      "imageIdea": "Kolaż 4 zdjęć zadowolonych klientek pokazujących swoje paznokcie (różne style: nude, french, kolorowe), każde zdjęcie w małym okrągłym kadrze, centralnie logo salonu i gwiazdki 5/5, jasne tło, profesjonalna typografia",
      "hook": "847 kobiet nas wybrało - dlaczego?",
      "targetEmotion": "Social proof i zaufanie"
    },
    {
      "type": "video",
      "platform": "instagram",
      "headline": "Obejrzyj zanim zarezerwujesz",
      "primaryText": "📍 Zapraszamy na wirtualny spacer po naszym salonie! Zobacz gdzie powstaje magia ✨ Nowoczesne wnętrze • Sterylne narzędzia • Profesjonalny zespół. Zarezerwuj wizytę ➡️",
      "description": "Wirtualny spacer po salonie",
      "cta": "Zarezerwuj wizytę",
      "imageIdea": "Kadr z wideo: eleganckie nowoczesne wnętrze salonu beauty, białe stanowiska do manicure, duże lustra, rośliny, ciepłe oświetlenie LED, czyste minimalistyczne wnętrze w stylu skandynawskim, widoczny fotel i narzędzia do manicure",
      "hook": "Zapraszamy na wirtualny spacer",
      "targetEmotion": "Zaufanie i profesjonalizm"
    }
  ],
  "copyVariants": [
    {
      "style": "emotional",
      "text": "✨ Pamiętasz ostatni raz gdy czułaś się naprawdę zadbana? Gdy spojrzałaś na swoje dłonie i poczułaś dumę? Czas odzyskać to uczucie! 💕\n\nNasz salon to miejsce gdzie Twoje paznokcie stają się dziełem sztuki. Każda wizyta to 2 godziny tylko dla Ciebie - kawa, relaks i metamorfoza.\n\nPierwsza wizyta -20% ➡️ Link w bio",
      "hook": "Pamiętasz ostatni raz gdy czułaś się naprawdę zadbana?",
      "benefit": "2 godziny relaksu i metamorfoza",
      "cta": "Pierwsza wizyta -20%"
    },
    {
      "style": "benefit",
      "text": "💅 3 rzeczy które wyróżniają nasz manicure:\n\n✅ Trzyma do 4 tygodni bez odpryskiwania\n✅ Lakiery premium które nie żółkną\n✅ Sterylizacja narzędzi w autoklawie\n\nDlaczego przepłacać za manicure który łuszczy się po tygodniu? U nas płacisz raz i cieszysz się miesiąc! 🙌\n\n➡️ Zarezerwuj pierwszą wizytę -20%",
      "hook": "3 rzeczy które wyróżniają nasz manicure",
      "benefit": "Manicure który trzyma 4 tygodnie",
      "cta": "Zarezerwuj z rabatem"
    },
    {
      "style": "urgency",
      "text": "⏰ TYLKO DO NIEDZIELI!\n\n🔥 -25% na wszystkie usługi manicure\n\nZostało tylko 7 wolnych terminów na ten tydzień! Nie czekaj aż będzie za późno 😱\n\nNasze klientki umawiają się z 2-tygodniowym wyprzedzeniem. Teraz masz szansę wskoczyć bez czekania!\n\n➡️ Zarezerwuj TERAZ zanim terminy znikną 💨",
      "hook": "TYLKO DO NIEDZIELI!",
      "benefit": "25% rabatu + gwarantowany termin",
      "cta": "Zarezerwuj TERAZ"
    },
    {
      "style": "social_proof",
      "text": "⭐⭐⭐⭐⭐ 4.9/5 z 847 opinii\n\n'Nareszcie salon gdzie nie muszę się martwić o jakość!' - Kasia\n'3 tygodnie i ani jednego odprysku!' - Ania\n'Najlepsza inwestycja w siebie!' - Marta\n\n98% naszych klientek wraca i poleca nas znajomym. Dołącz do grona zadowolonych! 💕\n\n➡️ Pierwsza wizyta -20% (link w bio)",
      "hook": "4.9/5 z 847 opinii",
      "benefit": "98% klientek wraca i poleca",
      "cta": "Dołącz do zadowolonych klientek"
    }
  ],
  "recommendations": [
    "PIXEL: Zainstaluj Piksel Facebook i skonfiguruj zdarzenia: ViewContent, Lead, Schedule (dla rezerwacji). Użyj Conversions API dla lepszego śledzenia.",
    "KREACJE: Testuj minimum 3 kreacje na zestaw reklam. Po 3-5 dniach wyłącz te z CTR <1% i CPC > średnia +30%.",
    "AUDIENCE: Zacznij od Core + Lookalike. Po 2 tygodniach dodaj remarketing. Nie łącz zimnych i ciepłych odbiorców w jednym zestawie.",
    "BUDŻET: Pierwsze 2 tygodnie przeznacz 60% budżetu na testowanie. Potem skaluj najlepsze zestawy o 20% co 3 dni.",
    "HARMONOGRAM: Publikuj reklamy w godzinach 10:00-12:00 i 19:00-22:00 - wtedy kobiety najchętniej przeglądają social media.",
    "A/B TESTY: Testuj nagłówki i CTA osobno. Nie zmieniaj więcej niż 1 element na raz. Każdy test min. 3 dni."
  ],
  "adsManagerSettings": {
    "campaignObjective": "Leads lub Conversions (jeśli masz konwersje na stronie)",
    "optimizationGoal": "Leads - optymalizuj pod kontakty / Conversions - pod rezerwacje",
    "attributionWindow": "7-day click, 1-day view (standard)",
    "scheduling": "Całodobowo na start, potem analiza godzin konwersji",
    "placements": "Advantage+ placements (pozwól Meta optymalizować)"
  }
}`;

      const userPrompt = `Wygeneruj PROFESJONALNĄ, szczegółową strategię kampanii Meta Ads dla:

=== DANE KLIENTA ===
Nazwa salonu: ${clientName}
Branża: ${industry}
Miasto/Region: ${city}
Budżet miesięczny: ${budget} PLN

=== CEL I KONTEKST ===
Główny cel: ${objective || 'Generowanie leadów i rezerwacji'}
Grupa docelowa: ${targetAudience || 'Kobiety 25-55 lat zainteresowane usługami beauty'}
Promowane usługi: ${services || 'Pełna oferta usług beauty'}

=== DODATKOWE INFORMACJE ===
${seasonality && seasonality !== 'brak' ? `Sezonowość/Okazja: ${seasonality}` : ''}
${promotions ? `Aktualne promocje: ${promotions}` : ''}
${competitors ? `Główni konkurenci: ${competitors}` : ''}
${usp ? `Unikalna wartość (USP): ${usp}` : ''}
${priceRange ? `Przedział cenowy usług: ${priceRange}` : ''}
${existingFollowers ? `Obecni obserwatorzy: ${existingFollowers}` : ''}
${previousCampaigns ? `Poprzednie kampanie: ${previousCampaigns}` : ''}

=== WYMAGANIA ===
1. Pełna strategia z 3-etapowym lejkiem (Awareness → Consideration → Conversion) z konkretnymi KPIs
2. Minimum 4 zestawy reklam z DOKŁADNYM targetowaniem (wiek, zainteresowania, zachowania, lokalizacja)
3. 6 różnych postów reklamowych (mix: 2x single, 1x carousel, 1x reels, 1x story, 1x video)
4. 4 warianty tekstów do testów A/B (emotional, benefit, urgency, social_proof)
5. 6 konkretnych rekomendacji optymalizacji z instrukcjami jak wdrożyć
6. Szczegółowe ustawienia do Ads Manager

KRYTYCZNE: 
- Każdy imageIdea musi mieć min. 30 słów szczegółowego opisu (kompozycja, oświetlenie, styl, detale)
- Wszystkie teksty muszą być GOTOWE DO SKOPIOWANIA - nie pisz "[nazwa]" tylko użyj ${clientName}
- Budżety muszą się sumować do ${budget} PLN
- Wszystkie wartości jako stringi, nie obiekty!`;


     console.log('Generating professional campaign for:', clientName, '| Budget:', budget, 'PLN');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({
          error: 'Przekroczono limit zapytań Groq. Spróbuj ponownie za chwilę.',
          details: errorText,
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({
          error: 'Nieprawidłowy klucz Groq API (401). Sprawdź GROQ_API_KEY w Secrets.',
          details: errorText,
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 400) {
        return new Response(JSON.stringify({
          error: 'Nieprawidłowe zapytanie do Groq (400). Sprawdź model i parametry.',
          details: errorText,
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        error: `Groq API error: ${response.status}`,
        details: errorText,
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    let campaign;
    try {
      campaign = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          campaign = JSON.parse(jsonMatch[1].trim());
        } catch {
          campaign = { rawContent: content };
        }
      } else {
        campaign = { rawContent: content };
      }
    }

    console.log('Campaign generated successfully');

    return new Response(JSON.stringify({ campaign }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in generate-campaign:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
