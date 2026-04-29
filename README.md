# 🌊 ChatFlow

> 通用 AI 对话 Web 应用 — 支持 OpenAI / Claude / Gemini / New-API 等多模型网关

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org)

---

## ✨ 特性

- 🎨 **现代 UI** — 深色/浅色双主题，响应式设计，移动端适配
- 🤖 **多模型支持** — OpenAI GPT 系列、Anthropic Claude、Google Gemini
- 🔌 **兼容 New-API** — 原生支持 New-API 网关，统一管理所有模型
- ⚡ **流式 SSE** — 打字机效果，实时显示回复
- 💬 **多对话管理** — 创建/切换/删除对话，自动保存
- 📝 **Markdown 渲染** — 代码高亮、表格支持
- 🔒 **可选认证** — 支持访问密码保护
- 🚀 **零构建** — 纯 Vanilla JS，clone 即用
- 🐳 **Docker 友好** — 提供 Dockerfile

---

## 🚀 快速开始

```bash
git clone https://github.com/cosmicdk/chatflow.git
cd chatflow
npm install
cp .env.example .env
# 编辑 .env，填入你的 API Key
npm start
```

访问 http://localhost:3000