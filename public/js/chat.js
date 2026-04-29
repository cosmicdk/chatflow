const ChatUI = {
  elements: {},
  init() {
    this.elements = {
      chatMessages: document.getElementById('chatMessages'),
      welcomeScreen: document.getElementById('welcomeScreen'),
      chatInput: document.getElementById('chatInput'),
      btnSend: document.getElementById('btnSend'),
      modelSelect: document.getElementById('modelSelect'),
      statusText: document.getElementById('statusText'),
      conversationList: document.getElementById('conversationList'),
      btnNewChat: document.getElementById('btnNewChat'),
    };
  },
  showWelcome() { if (this.elements.welcomeScreen) this.elements.welcomeScreen.style.display = 'flex'; },
  hideWelcome() { if (this.elements.welcomeScreen) this.elements.welcomeScreen.style.display = 'none'; },
  clearMessages() {
    if (!this.elements.chatMessages) return;
    this.elements.chatMessages.innerHTML = '';
    const welcome = document.createElement('div');
    welcome.className = 'welcome-screen';
    welcome.id = 'welcomeScreen';
    welcome.innerHTML = this.elements.welcomeScreen?.innerHTML || '';
    this.elements.chatMessages.appendChild(welcome);
    this.elements.welcomeScreen = welcome;
  },
  addMessage(role, content, id) {
    this.hideWelcome();
    const msgEl = document.createElement('div');
    msgEl.className = 'message ' + role;
    if (id) msgEl.dataset.msgId = id;
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'U' : 'AI';
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    if (role === 'assistant') {
      contentEl.innerHTML = Markdown.render(content);
      Markdown.enhanceCodeBlocks(contentEl);
    } else {
      contentEl.textContent = content;
    }
    msgEl.appendChild(avatar);
    msgEl.appendChild(contentEl);
    this.elements.chatMessages.appendChild(msgEl);
    this.scrollToBottom();
    return msgEl;
  },
  addAssistantMessageStream() {
    this.hideWelcome();
    const msgEl = document.createElement('div');
    msgEl.className = 'message assistant';
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'AI';
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.innerHTML = '<span class="typing-cursor"></span>';
    msgEl.appendChild(avatar);
    msgEl.appendChild(contentEl);
    this.elements.chatMessages.appendChild(msgEl);
    this.scrollToBottom();
    let fullContent = '';
    const self = this;
    return {
      update(chunk) {
        fullContent += chunk;
        contentEl.innerHTML = Markdown.render(fullContent) + '<span class="typing-cursor"></span>';
        Markdown.enhanceCodeBlocks(contentEl);
        self.scrollToBottom();
      },
      finish() {
        contentEl.innerHTML = Markdown.render(fullContent);
        Markdown.enhanceCodeBlocks(contentEl);
        self.scrollToBottom();
        return fullContent;
      },
      getContent() { return fullContent; },
    };
  },
  scrollToBottom() {
    requestAnimationFrame(() => {
      if (this.elements.chatMessages) this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    });
  },
  setInputEnabled(e) {
    if (this.elements.chatInput) this.elements.chatInput.disabled = !e;
    if (this.elements.btnSend) this.elements.btnSend.disabled = !e;
  },
  getInput() {
    const text = this.elements.chatInput?.value.trim() || '';
    if (text && this.elements.chatInput) { this.elements.chatInput.value = ''; this.elements.chatInput.style.height = 'auto'; }
    return text;
  },
  setStatus(text) { if (this.elements.statusText) this.elements.statusText.textContent = text; },
  updateModelSelect(models) {
    if (!this.elements.modelSelect) return;
    const cv = this.elements.modelSelect.value;
    this.elements.modelSelect.innerHTML = '';
    if (models.length === 0) { this.elements.modelSelect.innerHTML = '<option>No models</option>'; return; }
    const grouped = {};
    for (const m of models) { if (!grouped[m.provider]) grouped[m.provider] = []; grouped[m.provider].push(m); }
    for (const [p, pms] of Object.entries(grouped)) {
      const og = document.createElement('optgroup');
      og.label = p.toUpperCase();
      for (const m of pms) {
        const o = document.createElement('option');
        o.value = m.id; o.textContent = m.name;
        og.appendChild(o);
      }
      this.elements.modelSelect.appendChild(og);
    }
    if (cv && [...this.elements.modelSelect.options].some(o => o.value === cv)) this.elements.modelSelect.value = cv;
    else if (models.length > 0) this.elements.modelSelect.value = models[0].id;
  },
  renderConversationList(convs, activeId) {
    if (!this.elements.conversationList) return;
    this.elements.conversationList.innerHTML = '';
    for (const c of convs) {
      const item = document.createElement('div');
      item.className = 'conversation-item' + (c.id === activeId ? ' active' : '');
      item.dataset.convId = c.id;
      const t = document.createElement('span');
      t.className = 'conv-title'; t.textContent = c.title; t.title = c.title;
      const db = document.createElement('button');
      db.className = 'btn-delete-conv'; db.textContent = 'x';
      db.onclick = (e) => { e.stopPropagation(); if (confirm('Delete?')) { Storage.deleteConversation(c.id); App.loadConversations(); App.loadActiveConversation(); } };
      item.appendChild(t); item.appendChild(db);
      item.onclick = () => App.switchConversation(c.id);
      this.elements.conversationList.appendChild(item);
    }
  },
  showToast(msg, dur = 2000) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), dur + 300);
  },
};