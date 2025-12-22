import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.11.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    const start = Date.now()
    const requestId = crypto.randomUUID()

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { model, contents, config, runId, sessionId } = body

        console.log(`[Proxy] Start Request: ${requestId} | Model: ${model} | Run: ${runId}`)

        const apiKey = Deno.env.get('GEMINI_API_KEY')
        if (!apiKey) throw new Error('GEMINI_API_KEY not set in Edge Function secrets')

        const genAI = new GoogleGenerativeAI(apiKey)
        const aiModel = genAI.getGenerativeModel({ model: model || 'gemini-1.5-flash' })

        // Forward contents and generationConfig
        const result = await aiModel.generateContent({
            contents: contents,
            generationConfig: config || {}
        })

        const response = await result.response
        const text = response.text()
        const duration = Date.now() - start

        console.log(`[Proxy] Success: ${requestId} | Duration: ${duration}ms`)

        return new Response(
            JSON.stringify({ text, requestId, duration }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )
    } catch (error) {
        const duration = Date.now() - start
        console.error(`[Proxy] Error: ${requestId} | Error: ${error.message}`)

        return new Response(
            JSON.stringify({ error: error.message, requestId, duration }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: error.message?.includes('auth') ? 401 : 400
            }
        )
    }
})
