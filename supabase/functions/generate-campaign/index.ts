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
 
     const systemPrompt = `Jesteś ekspertem od Meta Ads (Facebook & Instagram) dla branży beauty w Polsce. Tworzysz PROFESJONALNE, szczegółowe strategie kampanii reklamowych gotowe do wdrożenia w Ads Managerze.
 
 KLUCZOWE ZASADY:
 1. Wszystkie wartości MUSZĄ być stringami (nie obiektami)
 2. Budżety podawaj jako "X PLN" lub "X% budżetu"
 3. Targetowanie opisuj szczegółowo z parametrami Ads Managera
 4. Teksty reklamowe muszą być gotowe do skopiowania
 5. Każdy post musi mieć konkretny pomysł na grafikę
 
 Format odpowiedzi (ścisły JSON):
 {
   "strategy": {
     "objective": "Główny cel kampanii zgodny z celami Meta Ads",
     "targetAudience": "Szczegółowy opis grupy docelowej: wiek, płeć, zainteresowania, zachowania, lokalizacja",
     "budget_allocation": "Awareness: 30% (X PLN), Consideration: 40% (X PLN), Conversion: 30% (X PLN)",
     "timeline": "Szczegółowy harmonogram np. Tydzień 1-2: Awareness, Tydzień 3-4: Consideration...",
     "daily_budget": "X PLN/dzień",
     "total_budget": "X PLN",
     "campaign_duration": "X dni/tygodni",
     "funnel_stages": [
       {
         "stage": "Awareness/Consideration/Conversion",
         "objective": "Cel tego etapu",
         "budget": "X PLN",
         "duration": "X dni",
         "kpis": ["Zasięg > X", "CPM < X PLN", "Częstotliwość 1.5-2"]
       }
     ]
   },
   "adSets": [
     {
       "name": "Nazwa zestawu reklam (np. 'Lookalike 1% - Kobiety 25-45')",
       "audience": "Szczegółowy opis: Wiek 25-45, Kobiety, Zainteresowania: beauty, spa, pielęgnacja, Lokalizacja: [miasto] +25km",
       "placement": "Feed FB/IG, Stories, Reels",
       "dailyBudget": "X PLN",
       "bidStrategy": "Najniższy koszt / Limit kosztu",
       "estimatedReach": "X-Y tys. osób"
     }
   ],
   "posts": [
     {
       "type": "single/carousel/video/reels",
       "platform": "facebook/instagram/both",
       "headline": "Nagłówek reklamy (max 40 znaków)",
       "primaryText": "Tekst główny reklamy - max 125 znaków dla mobile, przyciągający uwagę, z emoji",
       "description": "Dodatkowy opis widoczny w niektórych umiejscowieniach",
       "cta": "Zarezerwuj/Dowiedz się więcej/Wyślij wiadomość",
       "imageIdea": "SZCZEGÓŁOWY opis grafiki: kompozycja, kolory, elementy, styl, nastrój. Np: 'Zbliżenie dłoni z eleganckim manicure w kolorze nude na tle marmurowego blatu, delikatne światło dzienne, minimalistyczny styl, premium feel'",
       "hook": "Pierwsze słowa przyciągające uwagę",
       "targetEmotion": "Emocja którą ma wywołać (aspiracja/FOMO/relaks/pewność siebie)"
     }
   ],
   "copyVariants": [
     {
       "style": "emotional/benefit/urgency/social_proof",
       "text": "Pełny tekst reklamy gotowy do skopiowania",
       "hook": "Pierwsze zdanie przyciągające uwagę",
       "benefit": "Główna korzyść dla klienta",
       "cta": "Wezwanie do działania"
     }
   ],
   "recommendations": [
     "Konkretna rekomendacja z wyjaśnieniem dlaczego i jak wdrożyć"
   ],
   "adsManagerSettings": {
     "campaignObjective": "Ruch/Aktywność/Leady/Konwersje",
     "optimizationGoal": "Link clicks/Landing page views/Leads/Conversions",
     "attributionWindow": "7-day click, 1-day view",
     "scheduling": "Całodobowo / Określone godziny",
     "placements": "Automatyczne / Wybrane ręcznie"
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
 ${seasonality ? `Sezonowość/Okazja: ${seasonality}` : ''}
 ${promotions ? `Aktualne promocje: ${promotions}` : ''}
 ${competitors ? `Główni konkurenci: ${competitors}` : ''}
 ${usp ? `Unikalna wartość (USP): ${usp}` : ''}
 ${priceRange ? `Przedział cenowy usług: ${priceRange}` : ''}
 ${existingFollowers ? `Obecni obserwatorzy: ${existingFollowers}` : ''}
 ${previousCampaigns ? `Poprzednie kampanie: ${previousCampaigns}` : ''}
 
 === WYMAGANIA ===
 1. Pełna strategia z 3-etapowym lejkiem (Awareness → Consideration → Conversion)
 2. Minimum 4 zestawy reklam z dokładnym targetowaniem
 3. 6 różnych postów reklamowych (mix formatów: single, carousel, reels)
 4. 4 warianty tekstów do testów A/B w różnych stylach
 5. Szczegółowe rekomendacje optymalizacji
 6. Ustawienia do wpisania w Ads Manager
 
 WAŻNE: Wszystkie teksty muszą być po polsku, dostosowane do polskiego rynku i specyfiki branży beauty.`;

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
