const PROVIDERS = [
  {
    id: 'openai', name: 'OpenAI', icon: '⚡',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
      { id: 'o1', name: 'o1', provider: 'openai' },
      { id: 'o1-mini', name: 'o1 Mini', provider: 'openai' },
      { id: 'o3-mini', name: 'o3 Mini', provider: 'openai' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
    ],
  },
  {
    id: 'anthropic', name: 'Anthropic Claude', icon: '🧠',
    apiKey: process.env.ANTHROPIC_API_KEY,
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
    ],
  },
  {
    id: 'gemini', name: 'Google Gemini', icon: '🌐',
    apiKey: process.env.GEMINI_API_KEY,
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini' },
    ],
  },
  {
    id: 'compatible', name: 'Compatible (New-API)', icon: '🔌',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', provider: 'compatible' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', provider: 'compatible' },
      { id: 'qwen-plus', name: 'Qwen Plus', provider: 'compatible' },
      { id: 'qwen-max', name: 'Qwen Max', provider: 'compatible' },
      { id: 'moonshot-v1-8k', name: 'Moonshot v1', provider: 'compatible' },
      { id: 'glm-4', name: 'GLM-4', provider: 'compatible' },
    ],
  },
];

function getAvailableModels() {
  const models = [];
  for (const provider of PROVIDERS) {
    if (provider.apiKey) models.push(...provider.models);
  }
  return models;
}

function findProvider(modelId) {
  for (const provider of PROVIDERS) {
    if (!provider.apiKey) continue;
    const model = provider.models.find(m => m.id === modelId);
    if (model) return { provider, model };
  }
  return null;
}

module.exports = { PROVIDERS, getAvailableModels, findProvider };