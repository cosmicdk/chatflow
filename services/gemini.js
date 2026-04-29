async function geminiChatCompletion({ apiKey, model, messages, stream = true, max_tokens: maxOutputTokens, temperature, top_p: topP, onChunk }) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':' + (stream ? 'streamGenerateContent' : 'generateContent') + '?alt=sse&key=' + apiKey;

  const systemMessages = messages.filter(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const contents = conversationMessages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const body = {
    contents,
    generationConfig: {
      ...(maxOutputTokens && { maxOutputTokens }),
      ...(temperature !== undefined && { temperature }),
      ...(topP !== undefined && { topP }),
    },
  };

  if (systemMessages.length > 0) {
    body.systemInstruction = { parts: [{ text: systemMessages.map(m => m.content).join('\n') }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('Gemini API Error (' + response.status + '): ' + errorText);
  }

  if (stream && onChunk) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) onChunk({ done: false, content: text });
        } catch (e) { /* skip */ }
      }
    }
    onChunk({ done: true });
    return;
  }

  const json = await response.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

module.exports = { geminiChatCompletion };