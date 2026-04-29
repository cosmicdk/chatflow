const Storage = {
  KEYS: {
    CONVERSATIONS: 'chatflow_conversations',
    ACTIVE_CONV_ID: 'chatflow_active_conv',
    DARK_MODE: 'chatflow_dark_mode',
    SELECTED_MODEL: 'chatflow_selected_model',
    MAX_MODE: 'chatflow_max_mode',
  },
  getConversations() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.CONVERSATIONS) || '[]'); } catch { return []; }
  },
  saveConversations(convs) {
    try { localStorage.setItem(this.KEYS.CONVERSATIONS, JSON.stringify(convs)); } catch (e) {}
  },
  getConversation(id) { return this.getConversations().find(c => c.id === id) || null; },
  createConversation(title = 'New Chat') {
    const convs = this.getConversations();
    const newConv = { id: 'conv_' + Date.now(), title, messages: [], model: this.getSelectedModel(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    convs.unshift(newConv);
    this.saveConversations(convs);
    this.setActiveConversation(newConv.id);
    return newConv;
  },
  updateConversation(id, updates) {
    const convs = this.getConversations();
    const i = convs.findIndex(c => c.id === id);
    if (i !== -1) { convs[i] = { ...convs[i], ...updates, updatedAt: new Date().toISOString() }; this.saveConversations(convs); return convs[i]; }
    return null;
  },
  deleteConversation(id) {
    const convs = this.getConversations().filter(c => c.id !== id);
    this.saveConversations(convs);
    if (this.getActiveConversationId() === id) {
      if (convs.length > 0) this.setActiveConversation(convs[0].id);
      else this.clearActiveConversation();
    }
  },
  addMessage(convId, message) {
    const conv = this.getConversation(convId);
    if (!conv) return null;
    conv.messages.push(message);
    conv.updatedAt = new Date().toISOString();
    if (conv.title === 'New Chat' && message.role === 'user') {
      conv.title = message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '');
    }
    this.updateConversation(convId, conv);
    return conv;
  },
  getActiveConversationId() { return localStorage.getItem(this.KEYS.ACTIVE_CONV_ID) || null; },
  setActiveConversation(id) { localStorage.setItem(this.KEYS.ACTIVE_CONV_ID, id); },
  clearActiveConversation() { localStorage.removeItem(this.KEYS.ACTIVE_CONV_ID); },
  getActiveConversation() { const id = this.getActiveConversationId(); return id ? this.getConversation(id) : null; },
  getDarkMode() { return localStorage.getItem(this.KEYS.DARK_MODE) !== 'false'; },
  setDarkMode(e) { localStorage.setItem(this.KEYS.DARK_MODE, String(e)); },
  getSelectedModel() { return localStorage.getItem(this.KEYS.SELECTED_MODEL) || ''; },
  setSelectedModel(m) { localStorage.setItem(this.KEYS.SELECTED_MODEL, m); },
  getMaxMode() { return localStorage.getItem(this.KEYS.MAX_MODE) === 'true'; },
  setMaxMode(e) { localStorage.setItem(this.KEYS.MAX_MODE, String(e)); },
};