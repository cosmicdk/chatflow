async function openaiChatCompletion({ baseURL, apiKey, model, messages, stream = true, max_tokens, temperature, top_p, thinking, reasoning_effort, onChunk }) {
  const url = baseURL + '/chat/completions';
  const body = { model, messages, stream, ...(max_tokens && { max_tokens }), ...(temperature !== undefined && { temperature }), ...(top_p !== undefined && { top_p }), ...(thinking !== undefined && { thinking }), ...(reasoning_effort && { reasoning_effort }) };

  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey }, body: JSON.stringify(body) });

  if (!response.ok) {
    const errorText = await response.text();
    let errorJson;
    try { errorJson = JSON.parse(errorText); } catch { errorJson = { error: { message: errorText } }; }
    throw new Error('API Error (' + response.status + '): ' + (errorJson.error?.message || errorText));
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
        const t = line.trim();
        if (!t || !t.startsWith('data: ')) continue;
        const d = t.slice(6);
        if (d === '[DONE]') { onChunk({ done: true }); return; }
        try {
          const p = JSON.parse(d);
          onChunk({ done: false, content: p.choices?.[0]?.delta?.content || '', reasoning_content: p.choices?.[0]?.delta?.reasoning_content || '', finish_reason: p.choices?.[0]?.finish_reason });
        } catch (e) {}
      }
    }
    onChunk({ done: true });
    return;
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || '';
}

module.exports = { openaiChatCompletion };