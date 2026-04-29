const Markdown = {
  init() {
    if (typeof marked === 'undefined') return;
    marked.setOptions({ breaks: true, gfm: true });
    if (typeof hljs !== 'undefined') {
      marked.setOptions({
        highlight: (code, lang) => {
          if (lang && hljs.getLanguage(lang)) {
            try { return hljs.highlight(code, { language: lang }).value; } catch {}
          }
          return hljs.highlightAuto(code).value;
        },
      });
    }
  },
  render(text) {
    if (!text) return '';
    if (typeof marked === 'undefined') return this._escapeHtml(text).replace(/\n/g, '<br>');
    try { return marked.parse(text); } catch { return this._escapeHtml(text); }
  },
  _escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
    return text.replace(/[&<>]/g, c => map[c] || c);
  },
  enhanceCodeBlocks(container) {
    container.querySelectorAll('pre').forEach(pre => {
      if (pre.querySelector('.copy-btn')) return;
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.onclick = () => {
        const code = pre.querySelector('code')?.textContent || pre.textContent;
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => copyBtn.textContent = 'Copy', 2000);
        });
      };
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      wrapper.appendChild(copyBtn);
    });
  },
};