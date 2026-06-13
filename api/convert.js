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
    ? `You are an expert Roman Urdu to Urdu Nastaliq converter. Convert Roman Urdu text into proper Urdu script.
Rules:
- Convert EVERY Roman Urdu word to Urdu script
- Keep English words, names, numbers as-is
- Preserve punctuation and line breaks
- Output ONLY the converted Urdu text, nothing else
${poetry ? '- Format as poetry: each line on its own line' : ''}`
    : `You are an expert Urdu to Roman Urdu converter. Convert Urdu script to Roman Urdu using common Pakistani spelling. Output ONLY the converted text.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'API error' });
    }

    const data = await response.json();
    const result = data.content?.find(b => b.type === 'text')?.text?.trim() || '';
    return res.status(200).json({ result });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
    }
