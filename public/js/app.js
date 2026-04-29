const App = {
  isGenerating: false, abortController: null,
  async init() {
    ChatUI.init(); Markdown.init();
    this.applyTheme();
    this.applyMaxMode();
    await this.loadModels();
    this.loadConversations();
    this.loadActiveConversation();
    this.bindEvents();
    console.log('ChatFlow ready');
  },
  applyTheme() {
    const dm = Storage.getDarkMode();
    document.documentElement.setAttribute('data-theme', dm ? 'dark' : 'light');
    const t = document.getElementById('toggleDarkMode');
    if (t) t.checked = dm;
  },
  toggleTheme() { Storage.setDarkMode(!Storage.getDarkMode()); this.applyTheme(); },
  applyMaxMode() {
    const mm = Storage.getMaxMode();
    const btn = document.getElementById('btnMaxMode');
    if (btn) {
      btn.classList.toggle('active', mm);
      btn.title = mm ? 'Max ON: reasoning_effort=max' : 'Max: DeepSeek thinking (reasoning_effort=max)';
    }
  },
  toggleMaxMode() {
    const mm = !Storage.getMaxMode();
    Storage.setMaxMode(mm);
    this.applyMaxMode();
    ChatUI.showToast(mm ? 'Max mode ON - Deep thinking' : 'Max mode OFF');
  },
  async loadModels() {
    try {
      const models = await API.getModels();
      ChatUI.updateModelSelect(models);
      let sm = Storage.getSelectedModel();
      if (!sm || !models.find(m => m.id === sm)) sm = models.length > 0 ? models[0].id : '';
      Storage.setSelectedModel(sm);
      const ms = document.getElementById('modelSelect');
      if (ms && sm) ms.value = sm;
    } catch (err) { ChatUI.showToast('Failed to load models: ' + err.message); }
  },
  loadConversations() {
    ChatUI.renderConversationList(Storage.getConversations(), Storage.getActiveConversationId());
  },
  loadActiveConversation() {
    const conv = Storage.getActiveConversation();
    if (!conv) { ChatUI.clearMessages(); ChatUI.showWelcome(); return; }
    ChatUI.clearMessages(); ChatUI.hideWelcome();
    if (conv.messages?.length) {
      for (const msg of conv.messages) ChatUI.addMessage(msg.role, msg.content, msg.id);
    } else { ChatUI.showWelcome(); }
    this.loadConversations();
  },
  switchConversation(id) { Storage.setActiveConversation(id); this.loadActiveConversation(); this.closeSidebar(); },
  newConversation() {
    Storage.createConversation();
    ChatUI.clearMessages(); ChatUI.showWelcome();
    this.loadConversations(); this.closeSidebar();
  },
  async sendMessage() {
    if (this.isGenerating) return;
    const text = ChatUI.getInput(); if (!text) return;
    let conv = Storage.getActiveConversation();
    if (!conv) { conv = Storage.createConversation(); this.loadConversations(); }
    const sm = document.getElementById('modelSelect')?.value;
    if (!sm) { ChatUI.showToast('Select a model first'); return; }
    Storage.setSelectedModel(sm);
    Storage.addMessage(conv.id, { id: 'msg_' + Date.now(), role: 'user', content: text, timestamp: new Date().toISOString() });
    ChatUI.addMessage('user', text); this.loadConversations();
    this.isGenerating = true; ChatUI.setInputEnabled(false); ChatUI.setStatus('Thinking...'); ChatUI.hideWelcome();
    const uc = Storage.getConversation(conv.id);
    const msgs = (uc?.messages || []).map(m => ({ role: m.role, content: m.content }));
    const sui = ChatUI.addAssistantMessageStream();
    const maxMode = Storage.getMaxMode();
    const extraParams = maxMode ? { thinking: { type: 'enabled' }, reasoning_effort: 'max' } : {};
    try {
      this.abortController = await API.chatCompletions({
        model: sm, messages: msgs, ...extraParams,
        onChunk: (c) => { if (c.content) sui.update(c.content); },
        onDone: () => {
          const fc = sui.finish();
          Storage.addMessage(conv.id, { id: 'msg_' + Date.now(), role: 'assistant', content: fc, timestamp: new Date().toISOString() });
          this.loadConversations(); this.isGenerating = false; ChatUI.setInputEnabled(true); ChatUI.setStatus('Ready'); this.abortController = null;
        },
        onError: (e) => { ChatUI.showToast('Error: ' + e); this.isGenerating = false; ChatUI.setInputEnabled(true); ChatUI.setStatus('Error'); this.abortController = null; },
      });
    } catch (err) { ChatUI.showToast('Error: ' + err.message); this.isGenerating = false; ChatUI.setInputEnabled(true); ChatUI.setStatus('Ready'); }
  },
  stopGenerating() { if (this.abortController) { this.abortController.abort(); this.isGenerating = false; ChatUI.setInputEnabled(true); } },
  clearCurrentChat() {
    const conv = Storage.getActiveConversation();
    if (!conv || !confirm('Clear all messages?')) return;
    Storage.updateConversation(conv.id, { messages: [], title: 'New Chat' });
    this.loadActiveConversation();
  },
  toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('collapsed');
    document.getElementById('sidebarOverlay')?.classList.toggle('show');
  },
  closeSidebar() {
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar')?.classList.add('collapsed');
      document.getElementById('sidebarOverlay')?.classList.remove('show');
    }
  },
  bindEvents() {
    document.getElementById('btnSend')?.addEventListener('click', () => this.sendMessage());
    document.getElementById('chatInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); } });
    document.getElementById('chatInput')?.addEventListener('input', (e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'; });
    document.getElementById('btnNewChat')?.addEventListener('click', () => this.newConversation());
    document.getElementById('btnClearChat')?.addEventListener('click', () => this.clearCurrentChat());
    document.getElementById('modelSelect')?.addEventListener('change', (e) => Storage.setSelectedModel(e.target.value));
    document.getElementById('toggleDarkMode')?.addEventListener('change', () => this.toggleTheme());
    document.getElementById('btnMaxMode')?.addEventListener('click', () => this.toggleMaxMode());
    document.getElementById('btnMenu')?.addEventListener('click', () => this.toggleSidebar());
    document.getElementById('btnToggleSidebar')?.addEventListener('click', () => this.toggleSidebar());
    document.getElementById('sidebarOverlay')?.addEventListener('click', () => this.closeSidebar());
    document.querySelectorAll('.quick-prompt').forEach(b => {
      b.addEventListener('click', () => {
        const inp = document.getElementById('chatInput');
        if (inp) { inp.value = b.dataset.prompt; this.sendMessage(); }
      });
    });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); this.newConversation(); }
      if (e.key === 'Escape' && this.isGenerating) this.stopGenerating();
    });
  },
};
document.addEventListener('DOMContentLoaded', () => App.init());