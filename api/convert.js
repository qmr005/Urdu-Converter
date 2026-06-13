export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, mode, poetry } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  const isRTU = mode !== 'utr';

  const systemPrompt = isRTU
    ? `You are an expert Roman Urdu to Urdu Nastaliq converter. Convert Roman Urdu text into proper Urdu script. Rules: Convert EVERY Roman Urdu word to Urdu script. Keep English words/names/numbers as-is. Preserve punctuation and line breaks. Output ONLY the converted Urdu text, nothing else.${poetry ? ' Format as poetry.' : ''}`
    : `Convert Urdu script to Roman Urdu using common Pakistani spelling. Output ONLY the converted text, nothing else.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'API error' });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() || '';
    return res.status(200).json({ result });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
      }
