// ──────────────────────────────────────────────────────────────
// Cropware Studio — Edge Function: gemini-proxy
//
// Proxy server-side para a API Google Gemini. Mantém a chave
// GOOGLE_API_KEY como secret do projeto no Supabase — nunca
// aparece no navegador, nunca vai pro localStorage, nunca
// vai pro DevTools.
//
// O cliente (index.html) chama esta função em vez de bater
// direto no endpoint da Google. A função só forwarda o corpo
// da requisição pra Gemini depois de anexar a chave.
//
// ── Como configurar (uma vez só) ─────────────────────────────
//
//   1. Instalar a Supabase CLI:
//        npm i -g supabase
//        (ou: brew install supabase/tap/supabase)
//
//   2. Linkar o projeto local ao projeto Supabase:
//        supabase login
//        supabase link --project-ref tzsmxhwvtobwkqffgsxo
//
//   3. Setar a chave da Google como secret (NUNCA commitar):
//        supabase secrets set GOOGLE_API_KEY=AIzaSy...
//
//   4. Fazer deploy da função:
//        supabase functions deploy gemini-proxy
//
//   Alternativa sem CLI:
//      Dashboard → Edge Functions → Create a new function →
//      nome "gemini-proxy" → colar este arquivo → Deploy.
//      Depois: Project Settings → Edge Functions → Secrets →
//      adicionar GOOGLE_API_KEY.
//
// ── Contrato ─────────────────────────────────────────────────
//
//   POST /functions/v1/gemini-proxy
//   Headers: Authorization: Bearer <SUPABASE_ANON_KEY>
//   Body JSON: {
//     "type":    "text" | "image",
//     "payload": { ... corpo nativo da API Gemini ... }
//   }
//
//   Resposta: corpo da resposta da Gemini encaminhado como
//   veio (status, content-type). Erros próprios do proxy
//   vêm como { "error": "mensagem" } com status 4xx/5xx.
// ──────────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MODEL_TEXT  = 'gemini-2.5-flash';
const MODEL_IMAGE = 'gemini-3.1-flash-image-preview';

function jsonResponse(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const apiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!apiKey) {
    return jsonResponse(
      { error: 'GOOGLE_API_KEY não configurada no servidor. Defina o secret no Supabase.' },
      500,
    );
  }

  let body: { type?: string; payload?: unknown };
  try {
    body = await req.json();
  } catch (_e) {
    return jsonResponse({ error: 'JSON inválido no corpo da requisição.' }, 400);
  }

  const type = body?.type;
  const payload = body?.payload;

  if (type !== 'text' && type !== 'image') {
    return jsonResponse({ error: "Campo 'type' deve ser 'text' ou 'image'." }, 400);
  }
  if (!payload || typeof payload !== 'object') {
    return jsonResponse({ error: "Campo 'payload' obrigatório (objeto)." }, 400);
  }

  const model = type === 'image' ? MODEL_IMAGE : MODEL_TEXT;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Encaminha o corpo e status da Gemini como veio. O cliente
    // já sabe parsear erros retriáveis (429/500/503) e respostas
    // válidas (formato nativo da Gemini).
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: 'Falha ao chamar Gemini: ' + msg }, 502);
  }
});
