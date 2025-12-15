import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // We try GEMINI_API_KEY first, and fallback to GOOGLE_API_KEY if needed.
    // Usually it's the same project.
    const API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY')
    
    if (!API_KEY) {
        console.error("Missing GEMINI_API_KEY or GOOGLE_API_KEY")
        throw new Error('API Key is not set')
    }

    const { input, voice, audioConfig } = await req.json()

    // Log request (be careful not to log sensitive data completely)
    console.log(`TTS Request: ${voice?.name || 'default'} - ${voice?.languageCode || 'default'}`)

    // Google Cloud Text-to-Speech API URL
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input,
        voice,
        audioConfig,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
        console.error("Google TTS API Error:", data)
        return new Response(JSON.stringify({ 
            error: {
                message: "Google TTS API Error",
                details: data,
                status: response.status
            } 
        }), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Edge Function Error:", error)
    return new Response(JSON.stringify({ 
        error: {
            message: error.message || "Internal Server Error",
            stack: error.stack
        }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
