const { findProvider } = require('../config/providers');
const { openaiChatCompletion } = require('./openai');
const { anthropicChatCompletion } = require('./anthropic');
const { geminiChatCompletion } = require('./gemini');

async function callModel({ model, messages, stream = true, thinking, reasoning_effort, onChunk }) {
  const result = findProvider(model);
  if (!result) throw new Error('Model "' + model + '" not found.');

  const { provider } = result;
  const commonParams = { model, messages, stream, onChunk, max_tokens: 8192, temperature: 0.7, top_p: 1 };

  switch (provider.id) {
    case 'deepseek':
    case 'openai':
    case 'compatible':
      return openaiChatCompletion({ ...commonParams, baseURL: provider.baseURL, apiKey: provider.apiKey, ...(thinking !== undefined && { thinking }), ...(reasoning_effort && { reasoning_effort }) });
    case 'anthropic':
      return anthropicChatCompletion({ ...commonParams, apiKey: provider.apiKey });
    case 'gemini':
      return geminiChatCompletion({ ...commonParams, apiKey: provider.apiKey });
    default:
      throw new Error('Unsupported provider: ' + provider.id);
  }
}

module.exports = { callModel };