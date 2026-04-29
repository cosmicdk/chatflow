const express = require('express');
const router = express.Router();
const { callModel } = require('../services/factory');

router.post('/completions', async (req, res) => {
  try {
    const { model, messages, stream = true, temperature, max_tokens, thinking, reasoning_effort } = req.body;

    if (!model) return res.status(400).json({ error: 'model is required' });
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages is required' });
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      try {
        await callModel({
          model, messages, stream: true,
          ...(thinking !== undefined && { thinking }),
          ...(reasoning_effort && { reasoning_effort }),
          onChunk: (chunk) => {
            if (chunk.done) { res.write('data: [DONE]\n\n'); res.end(); return; }
            const sseData = {
              id: 'chatcmpl-' + Date.now().toString(36),
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000), model,
              choices: [{ index: 0, delta: { ...(chunk.content && { content: chunk.content }), ...(chunk.reasoning_content && { reasoning_content: chunk.reasoning_content }) }, ...(chunk.finish_reason && { finish_reason: chunk.finish_reason }) }],
            };
            res.write('data: ' + JSON.stringify(sseData) + '\n\n');
          },
        });
      } catch (err) {
        res.write('data: ' + JSON.stringify({ error: { message: err.message } }) + '\n\n');
        res.write('data: [DONE]\n\n');
        res.end();
      }
      return;
    }

    const content = await callModel({ model, messages, stream: false });
    res.json({
      id: 'chatcmpl-' + Date.now().toString(36), object: 'chat.completion',
      created: Math.floor(Date.now() / 1000), model,
      choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  } catch (err) {
    console.error('[Chat Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;