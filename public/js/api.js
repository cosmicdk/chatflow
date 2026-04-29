const API = {
  async request(endpoint, options = {}) {
    const config = { headers: { 'Content-Type': 'application/json' }, ...options };
    const response = await fetch(endpoint, config);
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(err.error?.message || 'HTTP ' + response.status);
    }
    return response;
  },
  async getModels() {
    const res = await this.request('/api/models');
    const data = await res.json();
    return data.models || [];
  },
  async chatCompletions({ model, messages, thinking, reasoning_effort, onChunk, onDone, onError }) {
    const controller = new AbortController();
    try {
      const body = { model, messages, stream: true };
      if (thinking !== undefined) body.thinking = thinking;
      if (reasoning_effort) body.reasoning_effort = reasoning_effort;
      const response = await fetch('/api/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(err.error?.message || 'HTTP ' + response.status);
      }
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
          if (d === '[DONE]') { onDone?.(); return; }
          try {
            const p = JSON.parse(d);
            if (p.error) throw new Error(p.error.message);
            const delta = p.choices?.[0]?.delta;
            if (delta) onChunk?.({ content: delta.content || '', reasoning_content: delta.reasoning_content || '', finish_reason: p.choices[0].finish_reason });
          } catch (e) { if (e.message && !e.message.includes('JSON')) throw e; }
        }
      }
      onDone?.();
    } catch (err) {
      if (err.name !== 'AbortError') onError?.(err.message);
    }
    return controller;
  },
};