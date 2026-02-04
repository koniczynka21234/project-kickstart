import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const campaignDataSchema = z.object({
  clientName: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  budget: z.string().max(50).optional(),
  impressions: z.string().max(50).optional(),
  reach: z.string().max(50).optional(),
  clicks: z.string().max(50).optional(),
  ctr: z.string().max(20).optional(),
  conversions: z.string().max(50).optional(),
  costPerConversion: z.string().max(50).optional(),
  bookings: z.string().max(50).optional(),
});

const inputSchema = z.object({
  campaignData: campaignDataSchema,
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const body = await req.json();
    
    // Validate input
    const validationResult = inputSchema.safeParse(body);
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

    const { campaignData } = validationResult.data;
    console.log('Generating recommendations for:', campaignData);

    // Parse numeric values for analysis
    const budget = parseFloat(campaignData.budget?.replace(/[^0-9.]/g, '') || '0');
    const impressions = parseFloat(campaignData.impressions?.replace(/[^0-9.]/g, '') || '0');
    const reach = parseFloat(campaignData.reach?.replace(/[^0-9.]/g, '') || '0');
    const clicks = parseFloat(campaignData.clicks?.replace(/[^0-9.]/g, '') || '0');
    const ctr = parseFloat(campaignData.ctr?.replace(/[^0-9.]/g, '') || '0');
    const conversions = parseFloat(campaignData.conversions?.replace(/[^0-9.]/g, '') || '0');
    const costPerConversion = parseFloat(campaignData.costPerConversion?.replace(/[^0-9.]/g, '') || '0');
    const bookings = parseFloat(campaignData.bookings?.replace(/[^0-9.]/g, '') || '0');

    // Calculate derived metrics
    const cpc = clicks > 0 ? budget / clicks : 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const bookingRate = conversions > 0 ? (bookings / conversions) * 100 : 0;
    const frequency = reach > 0 ? impressions / reach : 0;

    // Build analysis context
    let analysisContext = `
ANALIZA DANYCH KAMPANII:
- Budżet: ${budget} PLN
- Wyświetlenia: ${impressions}
- Zasięg: ${reach}
- Kliknięcia: ${clicks}
- CTR: ${ctr}%
- Konwersje: ${conversions}
- Koszt/konwersja: ${costPerConversion} PLN
- Rezerwacje: ${bookings}

OBLICZONE METRYKI:
- CPC (koszt kliknięcia): ${cpc.toFixed(2)} PLN
- Współczynnik konwersji: ${conversionRate.toFixed(1)}%
- % rezerwacji z konwersji: ${bookingRate.toFixed(1)}%
- Częstotliwość wyświetlania: ${frequency.toFixed(1)}x

BENCHMARKI DLA BEAUTY:
- Średni CTR branży: 1.5-3%
- Dobry CPC: 0.30-1.00 PLN
- Dobry koszt/konwersja: 15-40 PLN
- Optymalna częstotliwość: 2-4x
`;

    // Identify specific issues
    let issues = [];
    if (ctr < 1.5) issues.push("NISKI CTR - kreacje nie przyciągają uwagi");
    if (ctr > 5) issues.push("BARDZO WYSOKI CTR - sprawdź jakość ruchu");
    if (cpc > 1.5) issues.push("WYSOKI CPC - optymalizuj targetowanie");
    if (costPerConversion > 50) issues.push("WYSOKI KOSZT KONWERSJI - landing page wymaga poprawy");
    if (bookingRate < 50) issues.push("NISKA KONWERSJA NA REZERWACJE - uprość proces rezerwacji");
    if (frequency > 5) issues.push("WYSOKA CZĘSTOTLIWOŚĆ - zmień lub rozszerz grupę docelową");
    if (frequency < 1.5) issues.push("NISKA CZĘSTOTLIWOŚĆ - zwiększ budżet dla lepszego dotarcia");

    const prompt = `Jesteś ekspertem od kampanii Facebook Ads dla salonów beauty. Przeanalizuj dane i napisz 7 konkretnych rekomendacji.

${analysisContext}

ZIDENTYFIKOWANE PROBLEMY:
${issues.length > 0 ? issues.map(i => `- ${i}`).join('\n') : '- Brak krytycznych problemów'}

SALON: ${campaignData.clientName || 'Salon beauty'}
MIASTO: ${campaignData.city || 'Polska'}

ZASADY:
1. Każda rekomendacja MUSI zaczynać się od CZASOWNIKA: "Zwiększ", "Dodaj", "Przetestuj", "Uruchom", "Stwórz", "Włącz", "Rozważ"
2. Długość rekomendacji: 100-140 znaków każda - wystarczająco długie żeby były konkretne
3. Rekomendacje oparte na DANYCH z analizy - odwołuj się do konkretnych liczb i metryk
4. Pisz konkretnie z uzasadnieniem dlaczego

PRZYKŁADY (zauważ odpowiednią długość):
- "Zwiększ budżet w piątki i soboty o 40% - dane pokazują że to szczytowe dni rezerwacji w branży beauty"
- "Dodaj kampanię remarketingową 3-7 dni dla osób które nie dokończyły rezerwacji - odzyskasz utracone konwersje"
- "Przetestuj węższą grupę docelową 25-40 lat zamiast szerokiego targetowania - lepsza konwersja"
- "Włącz targetowanie geograficzne 10km od salonu zamiast całego miasta dla lepszego ROI"
- "Stwórz karuzelę z efektami przed/po z 3 najpopularniejszych zabiegów - zwiększa zaangażowanie"

Odpowiedz TYLKO 7 rekomendacjami (100-140 znaków każda), każda w nowej linii. BEZ numeracji, punktorów, gwiazdek.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limit zapytań przekroczony. Spróbuj ponownie za chwilę.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Brak środków na koncie AI. Doładuj kredyty.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let recommendations = data.choices?.[0]?.message?.content || '';
    
    // Clean up the response
    recommendations = recommendations
      .split('\n')
      .map((line: string) => line.replace(/^[\d\.\-\*\•]+\s*/, '').trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 7)
      .join('\n');
    
    console.log('Generated recommendations:', recommendations);

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
