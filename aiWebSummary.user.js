// ==UserScript==
// @name         AI Web Summarizer
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Floating AI summarizer button for web pages
// @author       Faisal Bhuiyan
// @match        *://*/*
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Default Chatbots
    const DEFAULT_CHATBOTS = {
        'byok': { id: 'byok', name: 'Gemini API', url: 'https://aistudio.google.com/apikey', characterLimit: 100000, premiumCharacterLimit: 200000 },
        'chatgpt': { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', characterLimit: 40000, premiumCharacterLimit: 200000 },
        'claude': { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', characterLimit: 50000, premiumCharacterLimit: 250000 },
        'gemini': { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', characterLimit: 32000, premiumCharacterLimit: 250000 },
        'grok': { id: 'grok', name: 'Grok', url: 'https://grok.com', characterLimit: 100000, premiumCharacterLimit: 200000 },
        'deepseek': { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com', characterLimit: 200000, premiumCharacterLimit: 200000 },
        'gemini_studio': { id: 'gemini_studio', name: 'Gemini AI Studio', url: 'https://aistudio.google.com/prompts/new_chat', characterLimit: 100000, premiumCharacterLimit: 200000 }
    };

    // Default Prompts
    const DEFAULT_PROMPTS = [
        { id: 'summary', name: 'Summary - Short', content: `Please summarize the following text in under 100 words.\nInstructions\n1. The summary should be well formatted and easily scannable.\n2. Don't start the text with "Let me...", or "Here is the summary...". Just give the results.\n3. Please keep it SHORT, no more than 100 words!`, isDefault: true },
        { id: '5-10-points', name: '5-10 Key Points - Short', content: `Please provide the 5-10 most important points from the text.\nUse bullet points and emojis to break up the text.` },
        { id: 'key-points-summary', name: 'Summary with Key Points & Takeaways - Detailed', content: `Please provide a summary of the following content in its original tone:\n1. First, give a concise one-sentence summary that captures the core message/theme\n2. Then, share a breakdown of the main topics discussed. For each topic:\n    - Expound very briefly on what was discussed on each topic\n    - Include any notable quotes or statistics if any.\n3. End with a brief takeaways\n4. Don't go beyond 200 words.\n5. Don't start the text with "Let me...", or "Here is the summary...". Just give the results.` },
        { id: 'short-form', name: 'Blinkist-Like Summary - Detailed', content: `Summarize the following content how Blinkist would.\nKeep the tone of the content. Keep it conversational.\nBreak the headers using relevant dynamic emojis.\nGo beyond the title in giving the summary, look through entire content.\nSprinkle in quotes or excerpts to better link the summary to the content.\nFor less than 30 mins long content, don't go beyond 150 words.\nFor 1hr+ long content don't go beyond 300 words.\nDon't start the text with "Let me...", or "Here is the summary...". Just give the results.` }
    ];

    // Truncation Config
    const TRUNC_CONFIG = {
        characterLimit: 20000,
        initialContentRatio: 0.4,
        chunkSize: 300,
        minChunksPerSegment: 3
    };

    // Storage Helpers
    function getStored(key, defaultVal) {
        return GM_getValue(key, defaultVal);
    }

    function setStored(key, val) {
        GM_setValue(key, val);
    }

    // Initialize storage
    if (!getStored('selectedBotId')) setStored('selectedBotId', 'chatgpt');
    if (!getStored('selectedPromptId')) setStored('selectedPromptId', 'summary');
    if (!getStored('excludedSites')) setStored('excludedSites', []);
    if (!getStored('customChatbots')) setStored('customChatbots', {});
    if (!getStored('customPrompts')) setStored('customPrompts', []);

    // Get all chatbots (default + custom)
    function getAllChatbots() {
        const custom = getStored('customChatbots', {});
        return { ...DEFAULT_CHATBOTS, ...custom };
    }

    // Get all prompts (default + custom)
    function getAllPrompts() {
        const custom = getStored('customPrompts', []);
        return [...DEFAULT_PROMPTS, ...custom];
    }

    // Theme Detection
    function isDarkMode() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // Styles with namespacing
    GM_addStyle(`
        #jsTLDR-container {
            position: fixed !important;
            bottom: 80px !important;
            right: 0 !important;
            z-index: 2147483647 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
        #jsTLDR-main-button {
            width: 40px !important;
            height: 40px !important;
            background: rgba(255,255,255,0.1) !important;
            opacity: 0.5 !important;
            backdrop-filter: blur(10px) !important;
            border-radius: 16px 0 0 16px !important;
            border: none !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 20px !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        #jsTLDR-main-button:hover {
            opacity: 1 !important;
            transform: translateX(-2px) !important;
            background: rgba(255,255,255,0.2) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        .jsTLDR-popup-menu {
            position: absolute !important;
            bottom: 44px !important;
            right: 2px !important;
            display: none !important;
            flex-direction: column !important;
            gap: 8px !important;
            background: ${isDarkMode() ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)'} !important;
            border: 1px solid ${isDarkMode() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
            border-radius: 8px !important;
            padding: 8px !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2) !important;
            z-index: 2147483647 !important;
        }
        .jsTLDR-popup-menu.jsTLDR-show {
            display: flex !important;
        }
        .jsTLDR-menu-button {
            width: 32px !important;
            height: 32px !important;
            background: ${isDarkMode() ? 'rgba(60,60,60,0.8)' : 'rgba(240,240,240,0.8)'} !important;
            border: none !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            font-size: 16px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        .jsTLDR-menu-button:hover {
            background: ${isDarkMode() ? 'rgba(80,80,80,0.9)' : 'rgba(220,220,220,0.9)'} !important;
            transform: scale(1.05) !important;
        }
        .jsTLDR-dropdown {
            position: absolute !important;
            right: 40px !important;
            bottom: 0 !important;
            width: 220px !important;
            max-height: 300px !important;
            overflow-y: auto !important;
            background: ${isDarkMode() ? 'rgba(30,30,30,0.98)' : 'rgba(255,255,255,0.98)'} !important;
            border: 1px solid ${isDarkMode() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
            border-radius: 8px !important;
            padding: 4px !important;
            display: none !important;
            z-index: 2147483648 !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
        }
        .jsTLDR-dropdown.jsTLDR-show {
            display: block !important;
        }
        .jsTLDR-dropdown-item {
            padding: 10px 12px !important;
            cursor: pointer !important;
            border: none !important;
            width: 100% !important;
            text-align: left !important;
            background: transparent !important;
            color: ${isDarkMode() ? '#fff' : '#000'} !important;
            border-radius: 4px !important;
            transition: background 0.15s !important;
            font-size: 14px !important;
            margin: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
        }
        .jsTLDR-dropdown-item:hover {
            background: ${isDarkMode() ? 'rgba(80,80,80,0.5)' : 'rgba(0,0,0,0.05)'} !important;
        }
        .jsTLDR-dropdown-item.jsTLDR-selected {
            background: ${isDarkMode() ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)'} !important;
            color: ${isDarkMode() ? '#60a5fa' : '#2563eb'} !important;
        }
        .jsTLDR-checkmark {
            font-size: 12px !important;
            margin-left: 8px !important;
        }

        /* Modal Styles */
        .jsTLDR-modal-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: rgba(0,0,0,0.6) !important;
            display: none !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 2147483646 !important;
            padding: 20px !important;
        }
        .jsTLDR-modal-overlay.jsTLDR-show {
            display: flex !important;
        }
        .jsTLDR-modal {
            background: ${isDarkMode() ? '#1a1a1a' : '#ffffff'} !important;
            border-radius: 12px !important;
            width: 100% !important;
            max-width: 600px !important;
            max-height: 80vh !important;
            overflow-y: auto !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.4) !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        .jsTLDR-modal-header {
            padding: 20px 24px !important;
            border-bottom: 1px solid ${isDarkMode() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
        }
        .jsTLDR-modal-title {
            font-size: 18px !important;
            font-weight: 600 !important;
            color: ${isDarkMode() ? '#fff' : '#000'} !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        .jsTLDR-modal-close {
            background: none !important;
            border: none !important;
            font-size: 24px !important;
            cursor: pointer !important;
            color: ${isDarkMode() ? '#999' : '#666'} !important;
            padding: 0 !important;
            margin: 0 !important;
            line-height: 1 !important;
        }
        .jsTLDR-modal-close:hover {
            color: ${isDarkMode() ? '#fff' : '#000'} !important;
        }
        .jsTLDR-modal-body {
            padding: 24px !important;
        }
        .jsTLDR-tabs {
            display: flex !important;
            gap: 8px !important;
            margin-bottom: 20px !important;
            border-bottom: 1px solid ${isDarkMode() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
        }
        .jsTLDR-tab {
            padding: 10px 16px !important;
            background: none !important;
            border: none !important;
            cursor: pointer !important;
            color: ${isDarkMode() ? '#999' : '#666'} !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            border-bottom: 2px solid transparent !important;
            transition: all 0.2s !important;
        }
        .jsTLDR-tab.jsTLDR-active {
            color: ${isDarkMode() ? '#60a5fa' : '#2563eb'} !important;
            border-bottom-color: ${isDarkMode() ? '#60a5fa' : '#2563eb'} !important;
        }
        .jsTLDR-tab-content {
            display: none !important;
        }
        .jsTLDR-tab-content.jsTLDR-active {
            display: block !important;
        }
        .jsTLDR-form-group {
            margin-bottom: 16px !important;
        }
        .jsTLDR-label {
            display: block !important;
            margin-bottom: 6px !important;
            color: ${isDarkMode() ? '#ccc' : '#333'} !important;
            font-size: 14px !important;
            font-weight: 500 !important;
        }
        .jsTLDR-input, .jsTLDR-textarea {
            width: 100% !important;
            padding: 10px 12px !important;
            background: ${isDarkMode() ? '#2a2a2a' : '#f5f5f5'} !important;
            border: 1px solid ${isDarkMode() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
            border-radius: 6px !important;
            color: ${isDarkMode() ? '#fff' : '#000'} !important;
            font-size: 14px !important;
            font-family: inherit !important;
            box-sizing: border-box !important;
        }
        .jsTLDR-textarea {
            min-height: 120px !important;
            resize: vertical !important;
        }
        .jsTLDR-button {
            padding: 10px 20px !important;
            background: ${isDarkMode() ? '#3b82f6' : '#2563eb'} !important;
            color: #fff !important;
            border: none !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            transition: background 0.2s !important;
        }
        .jsTLDR-button:hover {
            background: ${isDarkMode() ? '#2563eb' : '#1d4ed8'} !important;
        }
        .jsTLDR-button-secondary {
            background: ${isDarkMode() ? '#374151' : '#e5e7eb'} !important;
            color: ${isDarkMode() ? '#fff' : '#000'} !important;
        }
        .jsTLDR-button-secondary:hover {
            background: ${isDarkMode() ? '#4b5563' : '#d1d5db'} !important;
        }
        .jsTLDR-list-item {
            padding: 12px !important;
            background: ${isDarkMode() ? '#2a2a2a' : '#f5f5f5'} !important;
            border-radius: 6px !important;
            margin-bottom: 8px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
        }
        .jsTLDR-list-item-content {
            flex: 1 !important;
        }
        .jsTLDR-list-item-title {
            font-weight: 500 !important;
            color: ${isDarkMode() ? '#fff' : '#000'} !important;
            margin-bottom: 2px !important;
        }
        .jsTLDR-list-item-subtitle {
            font-size: 12px !important;
            color: ${isDarkMode() ? '#999' : '#666'} !important;
        }
        .jsTLDR-list-item-actions {
            display: flex !important;
            gap: 8px !important;
        }
        .jsTLDR-icon-button {
            padding: 6px 10px !important;
            background: ${isDarkMode() ? '#374151' : '#e5e7eb'} !important;
            border: none !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            font-size: 12px !important;
            color: ${isDarkMode() ? '#fff' : '#000'} !important;
        }
        .jsTLDR-icon-button:hover {
            background: ${isDarkMode() ? '#4b5563' : '#d1d5db'} !important;
        }
        .jsTLDR-icon-button.jsTLDR-danger:hover {
            background: #dc2626 !important;
            color: #fff !important;
        }

        @media (max-width: 640px) {
            .jsTLDR-modal {
                max-width: 100% !important;
                margin: 0 !important;
                border-radius: 0 !important;
                max-height: 100vh !important;
            }
            .jsTLDR-dropdown {
                width: 200px !important;
            }
        }
    `);

    // Extract Page Content
    async function extractPageContent() {
        const ignore = 'nav, aside, header, footer, button, script, style';
        const targets = ['h1','h2','h3','h4','h5','h6','p','li','td','div:not(:empty)']
            .map(tag => `${tag}:not(${ignore}):not(${ignore} *)`).join(', ');
        const els = document.querySelectorAll(targets);
        let content = '';
        for (const el of els) {
            if (el.offsetHeight === 0 || el.closest(ignore) || !el.textContent?.trim()) continue;
            const parent = el.parentElement;
            if (parent && (parent.matches('h1,h2,h3,h4,h5,h6,div,span,p,li') || parent.closest('h1,h2,h3,h4,h5,h6,div,span,p,li'))) continue;
            let text = el.innerText.trim().replace(/<[^>]+>/g, '').trim();
            if (!text) continue;
            switch (el.tagName.toLowerCase()) {
                case 'h1': content += `# ${text}\n`; break;
                case 'h2': content += `## ${text}\n`; break;
                case 'h3': content += `### ${text}\n`; break;
                case 'h4': case 'h5': case 'h6': content += `#### ${text}\n`; break;
                case 'li': content += `• ${text}\n`; break;
                default: content += `${text}\n`;
            }
        }
        return content.replace(/\n{2,}/g, '\n');
    }

    // Truncation Helpers
    function chunkText(text, size) {
        const chunks = [];
        let start = 0;
        while (start < text.length) {
            if (start + size >= text.length) {
                chunks.push(text.slice(start).trim());
                break;
            }
            let slice = text.slice(start, start + size);
            const lastSpace = slice.lastIndexOf(' ');
            slice = slice.slice(0, lastSpace);
            start += lastSpace + 1;
            chunks.push(slice.trim());
        }
        return chunks;
    }

    function totalLength(chunks) {
        return chunks.reduce((sum, c) => sum + c.length, 0);
    }

    function getProportions(total, num) {
        if (total <= 0 || num <= 0) return [];
        const props = [];
        const step = 1 / (num + 1);
        for (let i = 1; i <= num; i++) props.push(step * i);
        return props;
    }

    function truncateText(text, config) {
        const cfg = { ...TRUNC_CONFIG, ...config };
        if (text.length <= cfg.characterLimit) return text;
        const chunks = chunkText(text, cfg.chunkSize);
        const samples = [];
        let len = 0;
        const initLimit = Math.floor(cfg.characterLimit * cfg.initialContentRatio);
        let i = 0;
        while (i < chunks.length && len < initLimit) {
            const c = chunks[i];
            if (len + c.length <= initLimit) {
                samples.push(c);
                len += c.length;
            } else {
                const rem = initLimit - len;
                if (rem > 10) {
                    samples.push(c.slice(0, rem));
                    len += rem;
                }
                break;
            }
            i++;
        }
        const remChunks = chunks.slice(i);
        if (remChunks.length > 0) {
            const avg = totalLength(remChunks) / remChunks.length;
            const numSeg = Math.floor((cfg.characterLimit - len) / (avg * cfg.minChunksPerSegment));
            const props = getProportions(remChunks.length, numSeg);
            for (const p of props) {
                if (len >= cfg.characterLimit) break;
                const startIdx = Math.floor(remChunks.length * p);
                const numC = Math.min(cfg.minChunksPerSegment, remChunks.length - startIdx);
                for (let j = 0; j < numC; j++) {
                    const c = remChunks[startIdx + j];
                    const space = cfg.characterLimit - len;
                    if (c.length <= space) {
                        samples.push(c);
                        len += c.length;
                    } else if (space > 10) {
                        samples.push(c.slice(0, space));
                        len += space;
                        break;
                    }
                }
            }
        }
        return samples.join('').replace(/[\n\r]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    }

    // Summarize Action
    async function summarize() {
        const botId = getStored('selectedBotId');
        const promptId = getStored('selectedPromptId');
        const allBots = getAllChatbots();
        const allPrompts = getAllPrompts();
        const bot = allBots[botId];
        const prompt = allPrompts.find(p => p.id === promptId);

        if (!bot || !prompt) {
            alert('Please select a valid chatbot and prompt');
            return;
        }

        const raw = await extractPageContent();
        const truncRaw = bot.characterLimit ? truncateText(raw, { characterLimit: bot.characterLimit }) : raw;
        const fullText = `${prompt.content}\n\nPage Content: ${truncRaw}`;
        const final = bot.characterLimit ? truncateText(fullText, { characterLimit: bot.characterLimit }) : fullText;
        GM_setClipboard(final);
        window.open(bot.url, '_blank');
    }

    // UI State
    let menuHideTimeout = null;
    let lastTapTime = 0;

    // Create UI
    const container = document.createElement('div');
    container.id = 'jsTLDR-container';

    const mainButton = document.createElement('button');
    mainButton.id = 'jsTLDR-main-button';
    mainButton.innerHTML = '📋';

    const popupMenu = document.createElement('div');
    popupMenu.className = 'jsTLDR-popup-menu';

    // Show/hide menu with delay
    function showMenu() {
        if (menuHideTimeout) {
            clearTimeout(menuHideTimeout);
            menuHideTimeout = null;
        }
        popupMenu.classList.add('jsTLDR-show');
    }

    function hideMenuWithDelay() {
        menuHideTimeout = setTimeout(() => {
            popupMenu.classList.remove('jsTLDR-show');
        }, 300);
    }

    // Desktop hover
    mainButton.addEventListener('mouseenter', showMenu);
    mainButton.addEventListener('mouseleave', hideMenuWithDelay);
    popupMenu.addEventListener('mouseenter', showMenu);
    popupMenu.addEventListener('mouseleave', hideMenuWithDelay);

    // Desktop click
    mainButton.addEventListener('click', (e) => {
        e.preventDefault();
        summarize();
    });

    // Mobile tap (single = show menu, double = summarize)
    mainButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTime;

        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
            // Double tap
            summarize();
        } else {
            // Single tap
            if (popupMenu.classList.contains('jsTLDR-show')) {
                popupMenu.classList.remove('jsTLDR-show');
            } else {
                showMenu();
            }
        }
        lastTapTime = now;
    });

    // Bot Dropdown
    const botBtn = document.createElement('button');
    botBtn.className = 'jsTLDR-menu-button';
    botBtn.innerHTML = '🤖';
    const botDropdown = document.createElement('div');
    botDropdown.className = 'jsTLDR-dropdown';
    botDropdown.id = 'jsTLDR-bot-dropdown';

    function renderBotDropdown() {
        botDropdown.innerHTML = '';
        const allBots = getAllChatbots();
        const selectedId = getStored('selectedBotId');

        Object.values(allBots).forEach(bot => {
            const item = document.createElement('button');
            item.className = 'jsTLDR-dropdown-item';
            if (bot.id === selectedId) {
                item.classList.add('jsTLDR-selected');
            }
            item.innerHTML = `<span>${bot.name}</span>${bot.id === selectedId ? '<span class="jsTLDR-checkmark">✓</span>' : ''}`;
            item.onclick = () => {
                setStored('selectedBotId', bot.id);
                botDropdown.classList.remove('jsTLDR-show');
                renderBotDropdown();
            };
            botDropdown.appendChild(item);
        });
    }

    botBtn.onclick = (e) => {
        e.stopPropagation();
        botDropdown.classList.toggle('jsTLDR-show');
        promptDropdown.classList.remove('jsTLDR-show');
        renderBotDropdown();
    };

    // Prompt Dropdown
    const promptBtn = document.createElement('button');
    promptBtn.className = 'jsTLDR-menu-button';
    promptBtn.innerHTML = '📝';
    const promptDropdown = document.createElement('div');
    promptDropdown.className = 'jsTLDR-dropdown';
    promptDropdown.id = 'jsTLDR-prompt-dropdown';

    function renderPromptDropdown() {
        promptDropdown.innerHTML = '';
        const allPrompts = getAllPrompts();
        const selectedId = getStored('selectedPromptId');

        allPrompts.forEach(prompt => {
            const item = document.createElement('button');
            item.className = 'jsTLDR-dropdown-item';
            if (prompt.id === selectedId) {
                item.classList.add('jsTLDR-selected');
            }
            item.innerHTML = `<span>${prompt.name}</span>${prompt.id === selectedId ? '<span class="jsTLDR-checkmark">✓</span>' : ''}`;
            item.onclick = () => {
                setStored('selectedPromptId', prompt.id);
                promptDropdown.classList.remove('jsTLDR-show');
                renderPromptDropdown();
            };
            promptDropdown.appendChild(item);
        });
    }

    promptBtn.onclick = (e) => {
        e.stopPropagation();
        promptDropdown.classList.toggle('jsTLDR-show');
        botDropdown.classList.remove('jsTLDR-show');
        renderPromptDropdown();
    };

    // Settings Modal
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'jsTLDR-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'jsTLDR-modal';

    modalOverlay.appendChild(modal);

    function closeModal() {
        modalOverlay.classList.remove('jsTLDR-show');
    }

    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) closeModal();
    };

    function renderModal() {
        modal.innerHTML = `
            <div class="jsTLDR-modal-header">
                <h2 class="jsTLDR-modal-title">Settings</h2>
                <button class="jsTLDR-modal-close">×</button>
            </div>
            <div class="jsTLDR-modal-body">
                <div class="jsTLDR-tabs">
                    <button class="jsTLDR-tab jsTLDR-active" data-tab="prompts">Custom Prompts</button>
                    <button class="jsTLDR-tab" data-tab="chatbots">Custom Chatbots</button>
                    <button class="jsTLDR-tab" data-tab="exclusions">Site Exclusions</button>
                </div>
                <div class="jsTLDR-tab-content jsTLDR-active" data-content="prompts">
                    <div id="jsTLDR-prompts-list"></div>
                    <button class="jsTLDR-button" id="jsTLDR-add-prompt">+ Add Prompt</button>
                </div>
                <div class="jsTLDR-tab-content" data-content="chatbots">
                    <div id="jsTLDR-chatbots-list"></div>
                    <button class="jsTLDR-button" id="jsTLDR-add-chatbot">+ Add Chatbot</button>
                </div>
                <div class="jsTLDR-tab-content" data-content="exclusions">
                    <div id="jsTLDR-exclusions-list"></div>
                    <button class="jsTLDR-button" id="jsTLDR-add-exclusion">+ Exclude Current Site</button>
                </div>
            </div>
        `;

        // Tab switching
        modal.querySelectorAll('.jsTLDR-tab').forEach(tab => {
            tab.onclick = () => {
                modal.querySelectorAll('.jsTLDR-tab').forEach(t => t.classList.remove('jsTLDR-active'));
                modal.querySelectorAll('.jsTLDR-tab-content').forEach(c => c.classList.remove('jsTLDR-active'));
                tab.classList.add('jsTLDR-active');
                modal.querySelector(`[data-content="${tab.dataset.tab}"]`).classList.add('jsTLDR-active');
            };
        });

        modal.querySelector('.jsTLDR-modal-close').onclick = closeModal;

        renderPromptsList();
        renderChatbotsList();
        renderExclusionsList();

        // Add prompt handler
        modal.querySelector('#jsTLDR-add-prompt').onclick = () => showPromptForm();
        modal.querySelector('#jsTLDR-add-chatbot').onclick = () => showChatbotForm();
        modal.querySelector('#jsTLDR-add-exclusion').onclick = () => {
            const site = window.location.hostname.replace(/^www\./, '');
            const exclusions = getStored('excludedSites', []);
            if (!exclusions.includes(site)) {
                setStored('excludedSites', [...exclusions, site]);
                renderExclusionsList();
            }
        };
    }

    function renderPromptsList() {
        const container = modal.querySelector('#jsTLDR-prompts-list');
        const customPrompts = getStored('customPrompts', []);

        if (customPrompts.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No custom prompts yet</p>';
            return;
        }

        container.innerHTML = '';
        customPrompts.forEach((prompt, index) => {
            const item = document.createElement('div');
            item.className = 'jsTLDR-list-item';
            item.innerHTML = `
                <div class="jsTLDR-list-item-content">
                    <div class="jsTLDR-list-item-title">${prompt.name}</div>
                    <div class="jsTLDR-list-item-subtitle">${prompt.content.substring(0, 50)}...</div>
                </div>
                <div class="jsTLDR-list-item-actions">
                    <button class="jsTLDR-icon-button" data-action="edit" data-index="${index}">✏️</button>
                    <button class="jsTLDR-icon-button jsTLDR-danger" data-action="delete" data-index="${index}">🗑️</button>
                </div>
            `;
            container.appendChild(item);
        });

        // Attach handlers
        container.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.onclick = () => {
                const index = parseInt(btn.dataset.index);
                showPromptForm(customPrompts[index], index);
            };
        });

        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.onclick = () => {
                if (confirm('Delete this prompt?')) {
                    const index = parseInt(btn.dataset.index);
                    customPrompts.splice(index, 1);
                    setStored('customPrompts', customPrompts);
                    renderPromptsList();
                    renderPromptDropdown();
                }
            };
        });
    }

    function showPromptForm(existingPrompt = null, editIndex = null) {
        const formHtml = `
            <div style="margin-top: 20px; padding: 20px; background: ${isDarkMode() ? '#2a2a2a' : '#f5f5f5'}; border-radius: 8px;">
                <h3 style="margin-top: 0; color: ${isDarkMode() ? '#fff' : '#000'};">${existingPrompt ? 'Edit' : 'Add'} Prompt</h3>
                <div class="jsTLDR-form-group">
                    <label class="jsTLDR-label">Name</label>
                    <input type="text" class="jsTLDR-input" id="jsTLDR-prompt-name" value="${existingPrompt ? existingPrompt.name : ''}" placeholder="e.g., Quick Summary">
                </div>
                <div class="jsTLDR-form-group">
                    <label class="jsTLDR-label">Content</label>
                    <textarea class="jsTLDR-textarea" id="jsTLDR-prompt-content" placeholder="Enter your prompt instructions...">${existingPrompt ? existingPrompt.content : ''}</textarea>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="jsTLDR-button" id="jsTLDR-save-prompt">Save</button>
                    <button class="jsTLDR-button jsTLDR-button-secondary" id="jsTLDR-cancel-prompt">Cancel</button>
                </div>
            </div>
        `;

        const container = modal.querySelector('#jsTLDR-prompts-list');
        container.insertAdjacentHTML('afterend', formHtml);
        modal.querySelector('#jsTLDR-add-prompt').style.display = 'none';

        modal.querySelector('#jsTLDR-save-prompt').onclick = () => {
            const name = modal.querySelector('#jsTLDR-prompt-name').value.trim();
            const content = modal.querySelector('#jsTLDR-prompt-content').value.trim();

            if (!name || !content) {
                alert('Please fill in all fields');
                return;
            }

            const customPrompts = getStored('customPrompts', []);
            const newPrompt = {
                id: existingPrompt ? existingPrompt.id : `custom_${Date.now()}`,
                name,
                content
            };

            if (editIndex !== null) {
                customPrompts[editIndex] = newPrompt;
            } else {
                customPrompts.push(newPrompt);
            }

            setStored('customPrompts', customPrompts);
            modal.querySelector('#jsTLDR-add-prompt').style.display = 'block';
            modal.querySelector('#jsTLDR-add-prompt').previousElementSibling.remove();
            renderPromptsList();
            renderPromptDropdown();
        };

        modal.querySelector('#jsTLDR-cancel-prompt').onclick = () => {
            modal.querySelector('#jsTLDR-add-prompt').style.display = 'block';
            modal.querySelector('#jsTLDR-add-prompt').previousElementSibling.remove();
        };
    }

    function renderChatbotsList() {
        const container = modal.querySelector('#jsTLDR-chatbots-list');
        const customChatbots = getStored('customChatbots', {});

        if (Object.keys(customChatbots).length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No custom chatbots yet</p>';
            return;
        }

        container.innerHTML = '';
        Object.values(customChatbots).forEach(bot => {
            const item = document.createElement('div');
            item.className = 'jsTLDR-list-item';
            item.innerHTML = `
                <div class="jsTLDR-list-item-content">
                    <div class="jsTLDR-list-item-title">${bot.name}</div>
                    <div class="jsTLDR-list-item-subtitle">${bot.url}</div>
                </div>
                <div class="jsTLDR-list-item-actions">
                    <button class="jsTLDR-icon-button" data-action="edit" data-id="${bot.id}">✏️</button>
                    <button class="jsTLDR-icon-button jsTLDR-danger" data-action="delete" data-id="${bot.id}">🗑️</button>
                </div>
            `;
            container.appendChild(item);
        });

        container.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.onclick = () => {
                const bot = customChatbots[btn.dataset.id];
                showChatbotForm(bot);
            };
        });

        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.onclick = () => {
                if (confirm('Delete this chatbot?')) {
                    const bots = getStored('customChatbots', {});
                    delete bots[btn.dataset.id];
                    setStored('customChatbots', bots);
                    renderChatbotsList();
                    renderBotDropdown();
                }
            };
        });
    }

    function showChatbotForm(existingBot = null) {
        const formHtml = `
            <div style="margin-top: 20px; padding: 20px; background: ${isDarkMode() ? '#2a2a2a' : '#f5f5f5'}; border-radius: 8px;">
                <h3 style="margin-top: 0; color: ${isDarkMode() ? '#fff' : '#000'};">${existingBot ? 'Edit' : 'Add'} Chatbot</h3>
                <div class="jsTLDR-form-group">
                    <label class="jsTLDR-label">Name</label>
                    <input type="text" class="jsTLDR-input" id="jsTLDR-bot-name" value="${existingBot ? existingBot.name : ''}" placeholder="e.g., My Custom Bot">
                </div>
                <div class="jsTLDR-form-group">
                    <label class="jsTLDR-label">URL</label>
                    <input type="text" class="jsTLDR-input" id="jsTLDR-bot-url" value="${existingBot ? existingBot.url : ''}" placeholder="https://...">
                </div>
                <div class="jsTLDR-form-group">
                    <label class="jsTLDR-label">Character Limit (optional)</label>
                    <input type="number" class="jsTLDR-input" id="jsTLDR-bot-limit" value="${existingBot ? existingBot.characterLimit || '' : ''}" placeholder="e.g., 50000">
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="jsTLDR-button" id="jsTLDR-save-bot">Save</button>
                    <button class="jsTLDR-button jsTLDR-button-secondary" id="jsTLDR-cancel-bot">Cancel</button>
                </div>
            </div>
        `;

        const container = modal.querySelector('#jsTLDR-chatbots-list');
        container.insertAdjacentHTML('afterend', formHtml);
        modal.querySelector('#jsTLDR-add-chatbot').style.display = 'none';

        modal.querySelector('#jsTLDR-save-bot').onclick = () => {
            const name = modal.querySelector('#jsTLDR-bot-name').value.trim();
            const url = modal.querySelector('#jsTLDR-bot-url').value.trim();
            const limit = modal.querySelector('#jsTLDR-bot-limit').value.trim();

            if (!name || !url) {
                alert('Please fill in name and URL');
                return;
            }

            const customBots = getStored('customChatbots', {});
            const botId = existingBot ? existingBot.id : `custom_${Date.now()}`;

            customBots[botId] = {
                id: botId,
                name,
                url,
                characterLimit: limit ? parseInt(limit) : 50000,
                premiumCharacterLimit: limit ? parseInt(limit) : 50000
            };

            setStored('customChatbots', customBots);
            modal.querySelector('#jsTLDR-add-chatbot').style.display = 'block';
            modal.querySelector('#jsTLDR-add-chatbot').previousElementSibling.remove();
            renderChatbotsList();
            renderBotDropdown();
        };

        modal.querySelector('#jsTLDR-cancel-bot').onclick = () => {
            modal.querySelector('#jsTLDR-add-chatbot').style.display = 'block';
            modal.querySelector('#jsTLDR-add-chatbot').previousElementSibling.remove();
        };
    }

    function renderExclusionsList() {
        const container = modal.querySelector('#jsTLDR-exclusions-list');
        const exclusions = getStored('excludedSites', []);

        if (exclusions.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No excluded sites</p>';
            return;
        }

        container.innerHTML = '';
        exclusions.forEach((site, index) => {
            const item = document.createElement('div');
            item.className = 'jsTLDR-list-item';
            item.innerHTML = `
                <div class="jsTLDR-list-item-content">
                    <div class="jsTLDR-list-item-title">${site}</div>
                </div>
                <div class="jsTLDR-list-item-actions">
                    <button class="jsTLDR-icon-button jsTLDR-danger" data-action="delete" data-index="${index}">🗑️</button>
                </div>
            `;
            container.appendChild(item);
        });

        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.onclick = () => {
                const index = parseInt(btn.dataset.index);
                exclusions.splice(index, 1);
                setStored('excludedSites', exclusions);
                renderExclusionsList();
            };
        });
    }

    // Settings Button
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'jsTLDR-menu-button';
    settingsBtn.innerHTML = '⚙️';
    settingsBtn.onclick = (e) => {
        e.stopPropagation();
        renderModal();
        modalOverlay.classList.add('jsTLDR-show');
        popupMenu.classList.remove('jsTLDR-show');
    };

    // Assemble UI
    popupMenu.appendChild(botBtn);
    popupMenu.appendChild(botDropdown);
    popupMenu.appendChild(promptBtn);
    popupMenu.appendChild(promptDropdown);
    popupMenu.appendChild(settingsBtn);

    container.appendChild(mainButton);
    container.appendChild(popupMenu);

    document.body.appendChild(container);
    document.body.appendChild(modalOverlay);

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#jsTLDR-container')) {
            botDropdown.classList.remove('jsTLDR-show');
            promptDropdown.classList.remove('jsTLDR-show');
        }
    });

    // Hotkey (Ctrl+J)
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'j') {
            e.preventDefault();
            summarize();
        }
    });

    // Check if current site is excluded
    const currentSite = window.location.hostname.replace(/^www\./, '');
    const excludedSites = getStored('excludedSites', []);
    if (excludedSites.includes(currentSite)) {
        container.remove();
    }
})();