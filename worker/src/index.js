// Forja Coach — intermediario entre la app y la IA.
// Guarda la clave de Gemini en secreto, limita consultas por dispositivo
// y usa Workers AI como respaldo si Gemini se queda sin cuota.

const SYSTEM_PROMPT = `Eres «Coach», el entrenador personal integrado en Forja, una app para registrar entrenamientos de gimnasio.

Reglas:
- Responde siempre en el idioma del usuario (por defecto, español), con un tono cercano, claro y motivador.
- Habla solo de entrenamiento de fuerza, técnica de ejercicios, rutinas, progresión, calentamiento, descanso, cardio y hábitos saludables relacionados. Si te preguntan otra cosa, redirige amablemente al entrenamiento.
- Sé concreto: listas cortas, series × repeticiones, descansos y señales de buena técnica. Evita respuestas larguísimas.
- Seguridad: si mencionan dolor agudo, lesión, mareos, problemas cardíacos o embarazo, recomienda consultar a un médico o fisioterapeuta antes de seguir y no hagas diagnósticos.
- No des dosis de medicamentos ni recomiendes sustancias dopantes.
- Usa los datos del usuario (historial, récords) si te los dan, para personalizar.

Rutinas:
Cuando el usuario pida una rutina o plan, además de explicarla, añade AL FINAL un bloque exactamente con este formato (JSON válido, sin comentarios), usando SOLO nombres de ejercicios de la lista de la biblioteca que te indique el contexto:
\`\`\`forja-routine
{"name":"Nombre de la rutina","exercises":[{"name":"Press de banca","sets":4,"reps":8,"rest":120}]}
\`\`\`
Si el plan tiene varios días, añade un bloque por día.`;

const DAILY_LIMIT_DEFAULT = 40;

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Forja-Device, X-Forja-App',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/') {
      return json({ ok: true, service: 'forja-coach' }, 200, cors);
    }
    if (request.method !== 'POST' || url.pathname !== '/chat') {
      return json({ error: 'not_found' }, 404, cors);
    }
    if (request.headers.get('X-Forja-App') !== 'forja-ios') {
      return json({ error: 'forbidden' }, 403, cors);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400, cors); }

    const device = (request.headers.get('X-Forja-Device') || '').slice(0, 64);
    if (device.length < 8) return json({ error: 'no_device' }, 400, cors);

    // Límite diario por dispositivo
    const limit = parseInt(env.DAILY_LIMIT || DAILY_LIMIT_DEFAULT, 10);
    const day = new Date().toISOString().slice(0, 10);
    const key = `rl:${day}:${device}`;
    const used = parseInt((await env.RATE.get(key)) || '0', 10);
    if (used >= limit) {
      return json({ error: 'limit', message: `Has llegado al límite de ${limit} preguntas por hoy. Mañana se renueva 💪`, remaining: 0 }, 429, cors);
    }

    // Conversación (máx. 16 mensajes, 4000 caracteres cada uno)
    const messages = (Array.isArray(body.messages) ? body.messages : [])
      .slice(-16)
      .map(m => ({ role: m.role === 'model' ? 'model' : 'user', text: String(m.text || '').slice(0, 4000) }))
      .filter(m => m.text.trim().length > 0);
    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return json({ error: 'no_question' }, 400, cors);
    }
    const context = String(body.context || '').slice(0, 12000);
    const system = SYSTEM_PROMPT + (context ? `\n\nContexto del usuario (de su app):\n${context}` : '');

    let reply = null, provider = null, lastError = null;
    try {
      reply = await askGemini(env, system, messages);
      provider = 'gemini';
    } catch (e) {
      lastError = String(e && e.message || e);
    }
    if (!reply && env.AI) {
      try {
        reply = await askWorkersAI(env, system, messages);
        provider = 'workers-ai';
      } catch (e) {
        lastError = lastError + ' | ' + String(e && e.message || e);
      }
    }
    if (!reply) {
      return json({ error: 'ai_unavailable', message: 'El Coach no está disponible ahora mismo. Inténtalo en un rato.', detail: lastError }, 503, cors);
    }

    await env.RATE.put(key, String(used + 1), { expirationTtl: 60 * 60 * 26 });
    return json({ reply, provider, remaining: Math.max(0, limit - used - 1) }, 200, cors);
  },
};

async function askGemini(env, system, messages) {
  if (!env.GEMINI_API_KEY) throw new Error('sin clave');
  const model = env.GEMINI_MODEL || 'gemini-flash-lite-latest';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      generationConfig: { temperature: 0.7, maxOutputTokens: 1400 },
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
  if (!text) throw new Error('gemini vacío');
  return text;
}

async function askWorkersAI(env, system, messages) {
  // Lista de modelos separados por comas: se prueban en orden.
  const models = (env.FALLBACK_MODEL || '@cf/google/gemma-4-26b-a4b-it,@cf/meta/llama-3.2-3b-instruct')
    .split(',').map(s => s.trim()).filter(Boolean);
  const chat = [{ role: 'system', content: system },
    ...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }))];
  let lastErr = null;
  for (const model of models) {
    try {
      const out = await env.AI.run(model, { messages: chat, max_tokens: 1200 });
      let text = '';
      if (typeof out === 'string') text = out;
      else if (out) {
        text = out.response
          || out.result?.response
          || out.choices?.[0]?.message?.content
          || out.output_text
          || '';
      }
      text = String(text).replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      if (text) return text;
      lastErr = new Error(model + ' vacío');
    } catch (e) {
      lastErr = new Error(model + ': ' + String(e && e.message || e).slice(0, 160));
    }
  }
  throw lastErr || new Error('workers-ai sin modelos');
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });
}
