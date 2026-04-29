async function anthropicChatCompletion({ apiKey, model, messages, stream = true, max_tokens: maxTokens, temperature, top_p: topP, onChunk }) {
  let systemPrompt = '';
  const anthropicMessages = [];
  
  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt += (systemPrompt ? '\n' : '') + msg.content;
    } else if (msg.role === 'user' || msg.role === 'assistant') {
      anthropicMessages.push({ role: msg.role, content: msg.content });
    }
  }

  const body = {
    model, messages: anthropicMessages, stream,
    max_tokens: maxTokens || 4096,
    ...(systemPrompt && { system: systemPrompt }),
    ...(temperature !== undefined && { temperature }),
    ...(topP !== undefined && { top_p: topP }),
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorJson;
    try { errorJson = JSON.parse(errorText); } catch { errorJson = { error: { message: errorText } }; }
    throw new Error('Claude API Error (' + response.status + '): ' + (errorJson.error?.message || errorText));
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
          if (parsed.type === 'content_block_delta') {
            onChunk({ done: false, content: parsed.delta?.text || '' });
          } else if (parsed.type === 'message_stop') {
            onChunk({ done: false, content: '', finish_reason: 'stop' });
          }
        } catch (e) { /* skip */ }
      }
    }
    onChunk({ done: true });
    return;
  }

  const json = await response.json();
  return json.content?.[0]?.text || '';
}

module.exports = { anthropicChatCompletion };