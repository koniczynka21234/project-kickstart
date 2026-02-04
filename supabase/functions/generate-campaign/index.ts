import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation schema
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
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const { clientName, industry, city, budget, objective, targetAudience, services } = validationResult.data;
    
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!GOOGLE_GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    const systemPrompt = `Jesteś ekspertem od Facebook Ads dla branży beauty. Generujesz strategie kampanii reklamowych dla salonów kosmetycznych, fryzjerskich i spa.

Twoje odpowiedzi muszą być:
- Konkretne i gotowe do wdrożenia
- Dostosowane do polskiego rynku
- Skupione na generowaniu leadów i rezerwacji
- Napisane prostym, przystępnym językiem

Format odpowiedzi (JSON):
{
  "strategy": {
    "objective": "cel kampanii",
    "targetAudience": "opis grupy docelowej",
    "budget_allocation": "podział budżetu",
    "timeline": "harmonogram"
  },
  "adSets": [
    {
      "name": "nazwa zestawu reklam",
      "audience": "opis odbiorców",
      "placement": "umiejscowienie"
    }
  ],
  "posts": [
    {
      "type": "typ posta (carousel/single/video)",
      "headline": "nagłówek",
      "primaryText": "tekst główny (max 125 znaków)",
      "description": "opis",
      "cta": "przycisk CTA",
      "imageIdea": "pomysł na grafikę"
    }
  ],
  "copyVariants": [
    {
      "style": "styl (emotional/benefit/urgency/social_proof)",
      "text": "tekst reklamy"
    }
  ],
  "recommendations": ["lista rekomendacji"]
}`;

    const userPrompt = `Wygeneruj kompletną strategię kampanii Facebook Ads dla:

Salon: ${clientName}
Branża: ${industry}
Miasto: ${city}
Budżet miesięczny: ${budget} PLN
Cel: ${objective || 'Generowanie leadów i rezerwacji'}
Grupa docelowa: ${targetAudience || 'Kobiety 25-55 lat zainteresowane beauty'}
Usługi: ${services || 'Usługi beauty'}

Wygeneruj:
1. Strategię kampanii z podziałem budżetu
2. 3 zestawy reklam dla różnych grup
3. 5 postów reklamowych z tekstami
4. 4 warianty copy w różnych stylach
5. 5 rekomendacji optymalizacji`;

    console.log('Generating campaign for:', clientName);

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=' + GOOGLE_GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt + '\n\n' + userPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Przekroczono limit zapytań Gemini. Spróbuj ponownie za chwilę.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 403) {
        return new Response(JSON.stringify({ error: 'Nieprawidłowy klucz API Gemini. Sprawdź konfigurację.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    let campaign;
    try {
      // Gemini with responseMimeType='application/json' returns clean JSON
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
