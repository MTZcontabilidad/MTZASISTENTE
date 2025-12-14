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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
        console.error("Missing GEMINI_API_KEY")
        throw new Error('GEMINI_API_KEY is not set')
    }

    const { contents, generationConfig, model } = await req.json()

    // Default model if not provided
    const targetModel = model || 'gemini-1.5-flash'
    
    console.log(`Processing request for model: ${targetModel}`)

    // Construct the Gemini API URL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${GEMINI_API_KEY}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
        console.error("Gemini API Error:", data)
        return new Response(JSON.stringify({ 
            error: {
                message: "Gemini API Error",
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
